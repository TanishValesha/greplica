---
name: ec-update-working-memory
description: Update Engineering Context working memory from the current coding-agent session, recent code changes, and durable decisions. Use only when the user explicitly invokes ec-update-working-memory or asks to update working memory.
disable-model-invocation: true
---

# Update Engineering Context Working Memory

Update working memory with durable information learned during this coding session.

## Preconditions

Run from the target repository root or any subdirectory inside it.

1. Run `ec doctor`.
2. If `ec` is missing, tell the user to run the Engineering Context setup prompt from the README.
3. If `OPENAI_API_KEY` is missing, stop. Do not ask the user to paste the key into chat. Tell them to set it in their shell before launching the coding agent, or in repo-root `.env.local`.

`ec` automatically prepares repo memory state; do not ask the user to run a separate initialization command.

## Gather Evidence

Use the current conversation/session context plus code evidence. Read:

- `git status --short`
- `git diff --stat`
- focused `git diff` for changed areas
- files touched by the session when needed to verify claims
- existing relevant memory with `ec graph context "<task or changed area>"`

Use the current session as context, but verify durable code facts against files or diffs when possible.

## What To Store

Create memory for durable changes only:

- architectural decisions made during the session
- important new or changed flows/components
- risks, questions, or follow-up tasks that future agents should know
- facts that would save a future agent from rediscovering session context
- superseding claims when an old claim is known to be stale

Do not store:

- temporary debugging chatter
- every implementation detail
- command logs
- secrets or environment variable values
- obvious local code facts that a future agent can read immediately
- claims based only on vague conversation unless marked `unknown`

## Proposal Format

Write a JSON proposal to a temporary file:

```json
{
  "title": "Update working memory from session",
  "summary": "Durable context learned during the current coding session.",
  "creates": {
    "components": [],
    "flows": [],
    "claims": [
      {
        "id": "claim.example_session_decision",
        "kind": "decision",
        "text": "The session decided to keep the CLI primitive-focused and put workflows in coding-agent skills.",
        "truth": "source_verified",
        "intent": "intended",
        "about": [],
        "evidenced_by": ["source.current_session"]
      }
    ],
    "sources": [
      {
        "id": "source.current_session",
        "kind": "session",
        "ref": "Current coding-agent session",
        "title": "Current coding-agent session"
      }
    ],
    "edges": []
  }
}
```

Allowed claim kinds: `fact`, `requirement`, `decision`, `task`, `question`, `risk`.
Allowed truth values: `code_verified`, `source_verified`, `unknown`.
Allowed intent values: `intended`, `accidental`, `unknown`.

Use compact relationship fields where possible:

- `flow.touches[]` for Flow -> Component.
- `component.contains[]` for Component -> Component.
- `flow.contains[]` for Flow -> Flow.
- `claim.about[]` for Claim -> Component/Flow.
- `claim.evidenced_by[]` for Claim -> Source.
- `claim.supersedes[]`, `component.supersedes[]`, or `flow.supersedes[]` only when replacing known existing memory.

If you create a session source, connect source-backed claims with `evidenced_by`.

## Quality Bar

- Prefer a small update over broad memory churn.
- Reuse existing components/flows when `ec graph context` finds them.
- Create new components/flows only when the session introduced or clarified a durable area.
- Use `code_verified` only for claims checked against code.
- Use `source_verified` for claims grounded in the session or external artifacts.
- Use `unknown` for unresolved tasks, questions, and risks.

## Validate And Apply

1. Run `ec proposal validate <proposal-file>`.
2. Fix validation errors until valid.
3. Run `ec proposal apply <proposal-file>`.
4. Summarize the durable memory update and mention anything intentionally not stored.
