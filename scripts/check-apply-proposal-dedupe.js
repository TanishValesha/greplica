// scripts/check-apply-proposal-dedup.js
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url);
const { openDatabase } = await import(new URL("dist/libs/storage/sqlite/db.js", root));
const { SqliteRepository } = await import(new URL("dist/libs/storage/sqlite/repository.js", root));
const { KnowledgeGraphService } = await import(new URL("dist/libs/knowledge-graph/service.js", root));

const tmp = mkdtempSync(join(tmpdir(), "greplica-dedup-test-"));
const db = openDatabase(join(tmp, "graph.db"));

try {
  const repository = new SqliteRepository(db);
  const service = new KnowledgeGraphService(repository);
  const repo = {
    repo_root: join(tmp, "repo"),
    repo_name: "dedup-check-repo",
    default_branch: "main",
  };

  const initialized = service.initRepo(repo);

  // First proposal: seed an original claim. This also triggers embedding
  // generation for it via ensureForGraph, so it's comparable on the next call.
  const seedResult = await service.applyProposal(repo, {
    title: "Seed original claim",
    creates: {
      claims: [
        {
          id: "claim.rate_limit_by_file_size",
          kind: "decision",
          text: "Rate limiting on uploads is based on file size, not request count, because upload sizes vary widely.",
          truth: "source_verified",
          intent: "intended",
        },
      ],
    },
  });

  assert.deepEqual(
    seedResult.duplicate_warnings,
    {},
    "first proposal should have no duplicate warnings, nothing to compare against yet"
  );

  // Second proposal: a reworded near-duplicate of the seed claim.
  const secondResult = await service.applyProposal(repo, {
    title: "Rediscovered same decision, different session",
    creates: {
      claims: [
        {
          id: "claim.file_size_rate_limit_v2",
          kind: "decision",
          text: "File upload rate limits are determined by file size rather than the number of requests.",
          truth: "source_verified",
          intent: "intended",
        },
      ],
    },
  });

  const warnings = secondResult.duplicate_warnings;
  assert.ok(
    warnings["claim.file_size_rate_limit_v2"],
    "near-duplicate claim should be flagged in duplicate_warnings"
  );
  assert.ok(
    warnings["claim.file_size_rate_limit_v2"].some(
      (match) => match.claim_id === "claim.rate_limit_by_file_size"
    ),
    "flagged match should reference the original seed claim's id"
  );

  // Third proposal: a genuinely unrelated claim should NOT be flagged.
  const thirdResult = await service.applyProposal(repo, {
    title: "Unrelated claim",
    creates: {
      claims: [
        {
          id: "claim.unrelated_logging_format",
          kind: "fact",
          text: "Application logs are written in JSON format to stdout for ingestion by the log aggregator.",
          truth: "source_verified",
          intent: "intended",
        },
      ],
    },
  });

  assert.deepEqual(
    thirdResult.duplicate_warnings,
    {},
    "unrelated claim should not be flagged as a duplicate"
  );
} finally {
  db.close();
}

console.log("Apply proposal dedup checks passed.");