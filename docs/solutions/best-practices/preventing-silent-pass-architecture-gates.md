---
title: Prevent silent-pass architecture gates with catalog-derived fixtures
date: 2026-07-24
category: best-practices
module: architecture-standard
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - Adding or changing a normative static-analysis rule catalog
  - Building fixtures that prove every architecture rule can fail
  - Reviewing lexer-like source checks for comments strings templates or nested types
tags: [architecture-gates, adversarial-tests, rule-catalog, static-analysis, lexical-analysis]
---

# Prevent silent-pass architecture gates with catalog-derived fixtures

## Context

A passing architecture-gate suite can still leave published rules unenforced when it tests only representative fixtures or obvious syntax. Mandem's exported `architectureRules` catalog and evaluator live in `src/modules/architecture-standard/domain/rules.ts`; PR #4 remains open while this learning is written.

## Guidance

Treat the normative catalog as executable coverage inventory. Maintain one malformed matrix row per stable rule with its exact rule ID, repository-relative path, and concise message fragment. Assert that the row count equals the exported catalog count, then compare the complete result sequence to its rule-ID/path/message ordering.

Pair the matrix with focused lexical regressions. A lexical check needs both the smallest failing syntax and a nearby control that must not fail. In this checker, explicit-`any` coverage includes nested generic types and template-literal interpolation while masking ordinary quoted strings and comments. Import and IO checks likewise cover aliases, relative paths, `node:` built-ins, direct Bun APIs, and the exact allowed locations.

## Why This Matters

The catalog-to-matrix invariant proves each advertised rule can emit its promised finding. Focused syntax tests prevent a lightweight parser from silently missing valid code forms or flagging textual lookalikes. Together they turn a static gate from convention into an observable, deterministic contract.

## When to Apply

- A linter, policy checker, migration validator, or architecture analyzer exposes finite stable rule metadata.
- A checker uses path resolution, import parsing, regexes, or token stripping.
- A review finds a rule that exists in metadata but lacks a direct adversarial regression.

## Examples

    const rows = [
      ["ARCH-NO-EXPLICIT-ANY", "src/modules/broken/domain/io.ts", "explicit any"],
      ["ARCH-IO-PLACEMENT", "src/modules/broken/domain/io.ts", "limited to infrastructure"],
      // exactly one row per exported rule
    ] as const;

    expect(rows).toHaveLength(architectureRules.length);
    for (const [ruleId, path, messageFragment] of rows) {
      const finding = result.violations.find(
        (violation) => violation.ruleId === ruleId && violation.path === path,
      );
      expect(finding).toBeDefined();
      expect(finding?.message).toContain(messageFragment);
    }

For a quantity limit, assert both the permitted boundary and the first prohibited value. For a lexical rule, pair `Array<any[]>` or a template interpolation with ordinary string/comment controls. Reviewers should ask whether every catalog rule has a matrix row, every matcher has a focused failure and control, and full output ordering is asserted.
