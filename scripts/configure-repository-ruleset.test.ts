/** @fileoverview Tests the repository-ruleset GitHub API boundary. */
import { describe, expect, it } from "vitest";
import {
  configureRepositoryRuleset,
  repositoryRuleset,
  type GhClient,
} from "./configure-repository-ruleset";

interface Call {
  readonly arguments_: readonly string[];
  readonly input?: string;
}

function client(responses: readonly { readonly exitCode: number; readonly output: string }[]): {
  readonly gh: GhClient;
  readonly calls: readonly Call[];
} {
  const calls: Call[] = [];
  let index = 0;
  return {
    calls,
    gh: {
      async run(arguments_, input) {
        calls.push(input === undefined ? { arguments_ } : { arguments_, input });
        return responses[index++] ?? { exitCode: 1, output: "unexpected gh call" };
      },
    },
  };
}

function githubReadback(id: number): Record<string, unknown> {
  return {
    ...repositoryRuleset,
    id,
    rules: repositoryRuleset.rules.map((rule) =>
      rule.type === "pull_request"
        ? { ...rule, parameters: { ...rule.parameters, required_reviewers: [] } }
        : rule,
    ),
  };
}

describe("configure repository ruleset", () => {
  it("creates updates and verifies the canonical repository ruleset", async () => {
    const created = githubReadback(23);
    const fixture = client([
      { exitCode: 0, output: "github.com\n  ✓ Logged in" },
      { exitCode: 0, output: "[]" },
      { exitCode: 0, output: JSON.stringify(created) },
      { exitCode: 0, output: JSON.stringify(created) },
    ]);

    await expect(configureRepositoryRuleset("apply", fixture.gh)).resolves.toEqual({ id: 23, changed: true });
    expect(fixture.calls).toEqual([
      { arguments_: ["auth", "status"] },
      { arguments_: ["api", "repos/BrandonJF/mandem/rulesets", "-H", "X-GitHub-Api-Version: 2026-03-10"] },
      {
        arguments_: ["api", "--method", "POST", "repos/BrandonJF/mandem/rulesets", "-H", "X-GitHub-Api-Version: 2026-03-10", "--input", "-"],
        input: JSON.stringify(repositoryRuleset),
      },
      { arguments_: ["api", "repos/BrandonJF/mandem/rulesets/23", "-H", "X-GitHub-Api-Version: 2026-03-10"] },
    ]);
  });

  it("updates a drifted ruleset and accepts an already-conformant ruleset", async () => {
    const drifted = { ...repositoryRuleset, id: 7, enforcement: "disabled" };
    const conformant = { ...repositoryRuleset, id: 7, node_id: "RRS_kwDOexample" };
    const updating = client([
      { exitCode: 0, output: "github.com\n  ✓ Logged in" },
      { exitCode: 0, output: JSON.stringify([{ id: 7, name: repositoryRuleset.name }]) },
      { exitCode: 0, output: JSON.stringify(drifted) },
      { exitCode: 0, output: JSON.stringify(conformant) },
      { exitCode: 0, output: JSON.stringify(conformant) },
    ]);
    await expect(configureRepositoryRuleset("apply", updating.gh)).resolves.toEqual({ id: 7, changed: true });
    expect(updating.calls[3]).toEqual({
      arguments_: ["api", "--method", "PUT", "repos/BrandonJF/mandem/rulesets/7", "-H", "X-GitHub-Api-Version: 2026-03-10", "--input", "-"],
      input: JSON.stringify(repositoryRuleset),
    });

    const checking = client([
      { exitCode: 0, output: "github.com\n  ✓ Logged in" },
      { exitCode: 0, output: JSON.stringify([{ id: 7, name: repositoryRuleset.name }]) },
      { exitCode: 0, output: JSON.stringify(conformant) },
    ]);
    await expect(configureRepositoryRuleset("check", checking.gh)).resolves.toEqual({ id: 7, changed: false });
    expect(checking.calls).toHaveLength(3);
  });

  it("rejects drift, duplicate names, unauthenticated, and unauthorized responses without mutation", async () => {
    const drifted = client([
      { exitCode: 0, output: "github.com\n  ✓ Logged in" },
      { exitCode: 0, output: JSON.stringify([{ id: 4, name: repositoryRuleset.name }]) },
      { exitCode: 0, output: JSON.stringify({ ...repositoryRuleset, id: 4, enforcement: "disabled" }) },
    ]);
    await expect(configureRepositoryRuleset("check", drifted.gh)).rejects.toMatchObject({ exitCode: 1 });

    const duplicate = client([
      { exitCode: 0, output: "github.com\n  ✓ Logged in" },
      { exitCode: 0, output: JSON.stringify([{ ...repositoryRuleset, id: 4 }, { ...repositoryRuleset, id: 5 }]) },
    ]);
    await expect(configureRepositoryRuleset("apply", duplicate.gh)).rejects.toMatchObject({ exitCode: 2 });
    expect(duplicate.calls).toHaveLength(2);

    const unauthenticated = client([{ exitCode: 1, output: "not logged in" }]);
    await expect(configureRepositoryRuleset("check", unauthenticated.gh)).rejects.toMatchObject({ exitCode: 2 });

    const unauthorized = client([
      { exitCode: 0, output: "github.com\n  ✓ Logged in" },
      { exitCode: 1, output: "HTTP 403: Resource not accessible by integration" },
    ]);
    await expect(configureRepositoryRuleset("check", unauthorized.gh)).rejects.toMatchObject({ exitCode: 2 });
  });
});
