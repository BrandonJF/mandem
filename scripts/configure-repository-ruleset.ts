/** @fileoverview Creates, updates, and verifies Mandem's GitHub repository ruleset. */
import { assertRulesetApproval } from "./check-approval";

const apiVersion = "X-GitHub-Api-Version: 2026-03-10";
const repository = "repos/BrandonJF/mandem";

export const repositoryRuleset = {
  name: "mandem-repository-quality",
  target: "branch",
  enforcement: "active",
  bypass_actors: [],
  conditions: { ref_name: { include: ["refs/heads/main"], exclude: [] } },
  rules: [
    {
      type: "pull_request",
      parameters: {
        allowed_merge_methods: ["merge"],
        dismiss_stale_reviews_on_push: true,
        require_code_owner_review: false,
        require_last_push_approval: false,
        required_approving_review_count: 0,
        required_review_thread_resolution: true,
      },
    },
    {
      type: "required_status_checks",
      parameters: {
        do_not_enforce_on_create: false,
        required_status_checks: [{ context: "repository-quality" }],
        strict_required_status_checks_policy: true,
      },
    },
    { type: "deletion" },
    { type: "non_fast_forward" },
  ],
} as const;

export interface GhClient {
  run(arguments_: readonly string[], input?: string): Promise<{ readonly exitCode: number; readonly output: string }>;
}

class RulesetError extends Error {
  constructor(readonly exitCode: 1 | 2, message: string) { super(message); }
}

function api(arguments_: readonly string[]): readonly string[] {
  return ["api", ...arguments_, "-H", apiVersion];
}

function message(output: string): string {
  return output.trim().split("\n").slice(0, 40).join("\n") || "GitHub CLI command failed";
}

async function requireAuthentication(gh: GhClient): Promise<void> {
  const result = await gh.run(["auth", "status"]);
  if (result.exitCode !== 0) throw new RulesetError(2, `GitHub authentication failed: ${message(result.output)}`);
}

interface RemoteRuleset extends Record<string, unknown> { readonly id: number; readonly name: string; }

function parseRulesets(output: string): readonly RemoteRuleset[] {
  try {
    const value: unknown = JSON.parse(output);
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "object" && entry !== null && typeof (entry as { id?: unknown }).id === "number" && typeof (entry as { name?: unknown }).name === "string")) {
      throw new Error("expected an array of GitHub rulesets");
    }
    return value as readonly RemoteRuleset[];
  } catch (error: unknown) {
    throw new RulesetError(2, `GitHub ruleset discovery returned invalid JSON: ${error instanceof Error ? error.message : "unexpected error"}`);
  }
}

function parseRulesetStream(output: string): readonly RemoteRuleset[] {
  const lines = output.trim().split("\n").filter(Boolean);
  return lines.length === 0 ? [] : parseRulesets(`[${lines.join(",")}]`);
}

function conforms(value: RemoteRuleset): boolean {
  const definition = {
    name: value.name,
    target: value.target,
    enforcement: value.enforcement,
    bypass_actors: value.bypass_actors,
    conditions: value.conditions,
    rules: normalizeRules(value.rules),
  };
  return stableJson(definition) === stableJson(repositoryRuleset);
}

function normalizeRules(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((rule: unknown) => {
    if (typeof rule !== "object" || rule === null) return rule;
    const record = rule as Record<string, unknown>;
    if (record.type !== "pull_request" || typeof record.parameters !== "object" || record.parameters === null) {
      return rule;
    }
    const parameters = { ...(record.parameters as Record<string, unknown>) };
    if (Array.isArray(parameters.required_reviewers) && parameters.required_reviewers.length === 0) {
      delete parameters.required_reviewers;
    }
    return { ...record, parameters };
  });
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)).map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function discover(gh: GhClient): Promise<readonly RemoteRuleset[]> {
  const result = await gh.run(api([
    `${repository}/rulesets`,
    "--paginate",
    "--jq",
    ".[] | @json",
  ]));
  if (result.exitCode !== 0) throw new RulesetError(2, `GitHub ruleset discovery failed: ${message(result.output)}`);
  return parseRulesetStream(result.output).filter((ruleset) => ruleset.name === repositoryRuleset.name);
}

async function read(gh: GhClient, id: number): Promise<RemoteRuleset> {
  const result = await gh.run(api([`${repository}/rulesets/${id}`]));
  if (result.exitCode !== 0) throw new RulesetError(2, `GitHub ruleset read failed: ${message(result.output)}`);
  const rulesets = parseRulesets(`[${result.output}]`);
  return rulesets[0] ?? (() => { throw new RulesetError(2, "GitHub ruleset read returned no ruleset"); })();
}

export async function configureRepositoryRuleset(
  mode: "apply" | "check",
  gh: GhClient,
  authorize: () => Promise<void>,
): Promise<{ readonly id: number; readonly changed: boolean }> {
  if (mode === "apply") await authorize();
  await requireAuthentication(gh);
  const matches = await discover(gh);
  if (matches.length > 1) throw new RulesetError(2, "GitHub ruleset discovery found duplicate mandem-repository-quality rulesets");
  const discovered = matches[0];
  const existing = discovered ? await read(gh, discovered.id) : undefined;
  if (mode === "check") {
    if (!existing || !conforms(existing)) throw new RulesetError(1, "GitHub ruleset differs from mandem-repository-quality");
    return { id: existing.id, changed: false };
  }
  if (existing && conforms(existing)) return { id: existing.id, changed: false };
  const target = existing ? `${repository}/rulesets/${existing.id}` : `${repository}/rulesets`;
  const result = await gh.run(["api", "--method", existing ? "PUT" : "POST", target, "-H", apiVersion, "--input", "-"], JSON.stringify(repositoryRuleset));
  if (result.exitCode !== 0) throw new RulesetError(2, `GitHub ruleset apply failed: ${message(result.output)}`);
  const applied = await read(gh, existing?.id ?? parseRulesets(`[${result.output}]`)[0]?.id ?? 0);
  if (!conforms(applied)) throw new RulesetError(2, "GitHub ruleset read-back differs from mandem-repository-quality");
  return { id: applied.id, changed: true };
}

const ghClient: GhClient = {
  async run(arguments_, input) {
    const child = Bun.spawn(["gh", ...arguments_], {
      cwd: process.cwd(),
      stdin: input === undefined ? "ignore" : new Blob([input]),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { exitCode, output: `${stdout}${stderr}` };
  },
};

if (import.meta.main) {
  try {
    const argument = Bun.argv[2];
    if (Bun.argv.length !== 3 || (argument !== "--apply" && argument !== "--check")) throw new RulesetError(2, "use --apply or --check");
    const mode = argument === "--apply" ? "apply" : "check";
    const result = await configureRepositoryRuleset(
      mode,
      ghClient,
      () => assertRulesetApproval(
        repositoryRuleset,
        "745eda80-1e74-4866-bc95-2f2983b31025",
        "docs/plans/issues/u1a-documentation-authoring-quality-gates.md",
      ),
    );
    console.log(`GitHub ruleset ${result.id} ${result.changed ? "applied" : "matches"}.`);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "unexpected error";
    console.error(`repository ruleset failed: ${details}`);
    process.exitCode = error instanceof RulesetError ? error.exitCode : 2;
  }
}
