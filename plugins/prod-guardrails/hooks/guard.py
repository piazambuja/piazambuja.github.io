#!/usr/bin/env python3
"""PreToolUse hook: ask for confirmation before destructive infra commands.

Reads the hook payload from stdin. If the Bash command is destructive
(kubectl delete/drain/..., helm uninstall/rollback, terraform destroy or
auto-approved apply) and it may target production (terraform destroy always asks), it returns
permissionDecision "ask" so the user has to approve it.

Production is detected from an explicit --context/--kube-context flag,
the current kubectl context, or a terraform workspace, matched against
PROD_PATTERN (override with the CLAUDE_PROD_PATTERN env var).
Set CLAUDE_GUARD_ALL=1 to ask for every destructive command, prod or not.
"""
import json
import os
import re
import subprocess
import sys

PROD_PATTERN = re.compile(os.environ.get("CLAUDE_PROD_PATTERN", r"prod|prd|production|live"), re.I)

DESTRUCTIVE = [
    (r"\bkubectl\b.*\b(delete|drain|cordon|replace\s+--force|patch)\b", "kubectl"),
    (r"\bkubectl\b.*\bscale\b.*--replicas[= ]0\b", "kubectl"),
    (r"\bkubectl\b.*\brollout\s+(undo|restart)\b", "kubectl"),
    (r"\bhelm\b.*\b(uninstall|delete|rollback)\b", "helm"),
    (r"\bterraform\b.*\bdestroy\b", "terraform!"),
    (r"\bterraform\b.*\bapply\b.*-auto-approve\b", "terraform"),
    (r"\baws\b.*\b(delete-|terminate-instances|remove-)", "aws"),
]


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=3).stdout.strip()
    except Exception:
        return ""


def target_hint(command, tool):
    explicit = re.search(r"--(?:kube-)?context[= ](\S+)", command)
    if explicit:
        return explicit.group(1)
    if tool in ("kubectl", "helm"):
        return run(["kubectl", "config", "current-context"])
    if tool == "terraform":
        return run(["terraform", "workspace", "show"])
    if tool == "aws":
        return os.environ.get("AWS_PROFILE", "")
    return ""


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    if payload.get("tool_name") != "Bash":
        return 0
    command = (payload.get("tool_input") or {}).get("command", "")

    for pattern, tool in DESTRUCTIVE:
        if re.search(pattern, command, re.S):
            always = tool.endswith("!")
            tool = tool.rstrip("!")
            target = target_hint(command, tool)
            if always or os.environ.get("CLAUDE_GUARD_ALL") == "1" or PROD_PATTERN.search(target or "") or PROD_PATTERN.search(command):
                where = f" against '{target}'" if target else ""
                json.dump({
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "ask",
                        "permissionDecisionReason": f"prod-guardrails: destructive {tool} command{where}. Confirm this is intended.",
                    }
                }, sys.stdout)
            return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
