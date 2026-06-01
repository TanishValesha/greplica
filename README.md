# Engineering Context

Engineering Context (`ec`) stores lightweight codebase memory for coding agents. The CLI provides small graph-memory primitives; agent workflows are provided as skills.

## Agent Setup

Copy this prompt into the coding agent from the repository you want to use with Engineering Context:

````txt
Install Engineering Context for this repo.

Run these commands to install the CLI and fetch the skill folders:

```bash
set -euo pipefail

EC_REPO_URL="${EC_REPO_URL:-git@github.com:Autoloops/engineering-context.git}"
EC_TMP_DIR="$(mktemp -d)"

git clone --depth 1 "$EC_REPO_URL" "$EC_TMP_DIR"
npm install --prefix "$EC_TMP_DIR"
npm run --prefix "$EC_TMP_DIR" build
npm install -g "$EC_TMP_DIR"

printf "Skill folders:\\n%s\\n%s\\n" "$EC_TMP_DIR/skills/ec-bootstrap" "$EC_TMP_DIR/skills/ec-update-working-memory"
ec doctor --check-openai
```

Install these skills from the printed folders into your configured user-level skill directory using your native skill installation mechanism:

```txt
$EC_TMP_DIR/skills/ec-bootstrap
$EC_TMP_DIR/skills/ec-update-working-memory
```

If `ec doctor --check-openai` reports that `OPENAI_API_KEY` is missing or invalid, stop and ask me to set it. Do not ask me to paste the key into chat. I can set it either in my shell before starting the coding agent, or in this repo's `.env.local` file:

```txt
OPENAI_API_KEY=...
```

After setup, tell me how to invoke the `ec-bootstrap` and `ec-update-working-memory` skills.
````

## Configuration

`ec` looks for `OPENAI_API_KEY` in this order:

1. the process environment
2. `<repo-root>/.env.local`
3. `<repo-root>/.env`

The key is never printed by `ec doctor`.

Memory is stored in `~/.engineering-context/graph.db` by default. Set `ENGINEERING_CONTEXT_HOME` only for tests or advanced isolated runs.

## Commands

```bash
ec doctor [--check-openai]
ec graph read
ec graph context "<query>"
ec proposal validate <proposal.json>
ec proposal apply <proposal.json>
```

`ec` automatically prepares repo memory state when commands run, so users should not need a separate init step.
