# Documentation standards

Mandem keeps maintained documentation reachable from the repository root. A reader should be able
to start at `README.md`, follow directory indexes, and reach any maintained document without
guessing its path.

## README indexes

Every in-scope directory below `docs/` has a `README.md`. Its index links every maintained local
Markdown, YAML, and YML document and every in-scope child directory. Parent indexes link each child
directory index. Keep links relative, point them at files that exist in the repository, and repair
the relevant indexes when a document is added, renamed, moved, or removed.

The repository root also indexes the shared agent instructions, ExecPlan rules, documentation,
scripts, Git hooks, module documentation, and every checked-in agent skill. A skill's `SKILL.md`
indexes its local maintained Markdown documents, including documents in `references/`.

## File overviews

Every authored TypeScript or TSX file in the repository's declared source roots begins with a
meaningful JSDoc file overview. Put the overview before all other content, except for an optional
shebang. Include `@fileoverview` and describe the file's responsibility in ordinary words.

For example:

    /**
     * @fileoverview Reads a repository snapshot from the working tree.
     */

Do not use a placeholder such as `TODO`, `TBD`, `description`, `file`, or `placeholder`. A marker
later in a file, inside a string, or in an ordinary comment does not meet the requirement.

Generated files, vendored files, declaration files, build output, and disposable test fixtures are
excluded only where the repository policy declares them excluded. Add a deliberate policy change
and a test before adding another exception.
