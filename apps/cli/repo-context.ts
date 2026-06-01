import { execFileSync } from "node:child_process";
import { basename } from "node:path";
import type { RepoRef } from "../../libs/knowledge-graph/service.js";

export function detectRepoContext(cwd = process.cwd()): RepoRef {
  const repoRoot = git(cwd, ["rev-parse", "--show-toplevel"]);
  const remoteUrl = gitOptional(repoRoot, ["config", "--get", "remote.origin.url"]) ?? `local:${repoRoot}`;

  return {
    repo_root: repoRoot,
    remote_url: remoteUrl,
    repo_name: repoName(remoteUrl, repoRoot),
    default_branch: defaultBranch(repoRoot),
  };
}

function defaultBranch(repoRoot: string): string {
  const remoteHead = gitOptional(repoRoot, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (remoteHead?.startsWith("origin/")) return remoteHead.slice("origin/".length);

  return "main";
}

function repoName(remoteUrl: string, repoRoot: string): string {
  if (remoteUrl.startsWith("local:")) return basename(repoRoot);
  const withoutGit = remoteUrl.endsWith(".git") ? remoteUrl.slice(0, -4) : remoteUrl;
  const lastPart = withoutGit.split(/[/:]/).filter(Boolean).at(-1);
  return lastPart ?? basename(repoRoot);
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function gitOptional(cwd: string, args: string[]): string | undefined {
  try {
    const output = git(cwd, args);
    return output.length > 0 ? output : undefined;
  } catch {
    return undefined;
  }
}
