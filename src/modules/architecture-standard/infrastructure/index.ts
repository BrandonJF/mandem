/** @fileoverview Infrastructure adapters for architecture analysis. */
export { FileSystemTree } from "./repositories/file-system-tree";
export { GitNativeIssueGraphRepository } from "./repositories/git-native-issue-graph-repository";
export { NativeIssueGraphApprovalReader } from "./services/native-issue-graph-approval";
export { NativeIssueGraphWriter } from "./services/native-issue-graph-writer";
export { GitHubIssueGraphProvider } from "./services/github-issue-graph-provider";
export type { GhApiRequest, GhApiRunner } from "./services/github-issue-graph-provider";
