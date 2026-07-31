/** @fileoverview Specifies approval-gated native graph setter planning. */
import { describe, expect, it } from "vitest";
import {
  classifyNativeRef,
  nativeMetadataRequiresWrite,
  planNativeIssueGraphMetadata,
} from "../application/use-cases/set-native-issue-graph-metadata";

describe("set native issue graph metadata", () => {
  it("does not let matching local metadata hide a lost push or remote drift", () => {
    expect(nativeMetadataRequiresWrite(true, { baseline: "base", result: "result", local: "base", remote: "base" })).toBe(false);
    expect(nativeMetadataRequiresWrite(true, { baseline: "base", result: "result", local: "result", remote: "base" })).toBe(true);
    expect(nativeMetadataRequiresWrite(true, { baseline: "base", result: "result", local: "base", remote: "other" })).toBe(true);
  });
  it("does not create writes when the approved graph is already current", () => {
    expect(planNativeIssueGraphMetadata([], [])).toEqual([]);
  });

  it("accepts only approved baseline or computed result during lost-response retry", () => {
    expect(classifyNativeRef({ baseline: "a", result: "b", local: "b", remote: "a" })).toBe("push-result");
    expect(classifyNativeRef({ baseline: "a", result: "b", local: "b", remote: "b" })).toBe("complete");
    expect(classifyNativeRef({ baseline: "a", result: "b", local: "a", remote: "b" })).toBe("adopt-result");
    expect(classifyNativeRef({ baseline: "a", result: "b", local: "a", remote: "a" })).toBe("create-result");
    expect(() => classifyNativeRef({ baseline: "a", result: "b", local: "c", remote: "c" })).toThrow("third state");
  });

  it("plans a partial batch without rewriting published result refs", () => {
    const states = [{ baseline: "a", result: "b", local: "b", remote: "b" }, { baseline: "c", result: "d", local: "c", remote: "c" }];
    expect(states.map(classifyNativeRef)).toEqual(["complete", "create-result"]);
  });
});
