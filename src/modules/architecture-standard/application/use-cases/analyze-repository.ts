/** @fileoverview Architecture analysis application use case. */
import { evaluateArchitecture } from "../../domain/rules";
import type { AnalysisResult, RepositoryFile } from "../../domain/types";

export interface RepositoryTree { read(root: string): Promise<RepositoryFile[]>; }
export async function analyzeRepository(tree: RepositoryTree, root: string): Promise<AnalysisResult> { return evaluateArchitecture(await tree.read(root)); }
