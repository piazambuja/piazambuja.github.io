# prod-guardrails

A `PreToolUse` hook that makes Claude Code ask for your approval before it runs a destructive infrastructure command that may hit production.

## What it catches

| Tool | Commands |
| --- | --- |
| kubectl | `delete`, `drain`, `cordon`, `patch`, `replace --force`, `scale --replicas=0`, `rollout undo/restart` |
| helm | `uninstall`, `delete`, `rollback` |
| terraform | `destroy` (always asks), `apply -auto-approve` |
| aws cli | `delete-*`, `remove-*`, `terminate-instances` |

## How it decides it's production

1. An explicit `--context` / `--kube-context` flag in the command.
2. Otherwise the current `kubectl` context, the `terraform workspace`, or `AWS_PROFILE`.
3. Matched against `prod|prd|production|live` (case-insensitive).

## Settings

| Variable | Effect |
| --- | --- |
| `CLAUDE_PROD_PATTERN` | Your own regex for production names, e.g. `acme-prd|-prod-` |
| `CLAUDE_GUARD_ALL=1` | Ask for every destructive command, in any environment |

Requires `python3` on the machine running Claude Code. It never blocks on its own: it only turns the call into an approval prompt.
