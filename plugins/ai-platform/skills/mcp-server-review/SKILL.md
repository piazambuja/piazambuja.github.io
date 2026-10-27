---
name: mcp-server-review
description: Review an MCP server (or a plan for one) for tool design, security, auth and operability before it is exposed to agents, or put behind an MCP gateway or internal catalog. Use when the user builds, reviews or onboards an MCP server.
---

# MCP server review

## Tool design

- Each tool does one job a user would name. Prefer `create_ticket` over a generic `call_api`.
- Names are verbs in snake_case; descriptions say when to use the tool and when not to, in one or two sentences.
- Input schemas are strict: enums instead of free strings, required fields marked, sensible limits on page sizes.
- Outputs are compact and model-friendly: return the fields an agent needs, paginate, avoid dumping raw API payloads.
- Errors explain how to fix the call ("`project_id` not found; list projects with `list_projects`").
- Separate read and write tools so clients can allow reads and require approval for writes.

## Security

- Auth: OAuth 2.1 for remote servers, acting on behalf of the user; never a shared admin token for everyone.
- Least privilege: scopes per tool; destructive tools behind confirmation or not exposed.
- Treat everything the tools return as untrusted data: content from tickets, emails or web pages can carry prompt injection. Don't let tool output trigger other write tools without the user.
- No secrets in tool results or logs. Validate and sanitise inputs that reach shells, SQL or URLs (SSRF).
- Pin and review dependencies; publish who owns the server.

## Operability

- Health endpoint, structured logs with a request id, metrics per tool (calls, errors, latency).
- Rate limits per user; timeouts on every upstream call.
- Versioned releases and a changelog; breaking schema changes get a new tool name.

## Gateway / catalog readiness

When the server goes behind an MCP gateway or into an internal catalog, check: owner and support channel, data classification, which tools are write/destructive, required scopes, SLO, and an example prompt that exercises each tool.

## Output

A table of findings by severity (blocker / should fix / nice to have) with the concrete change, then a go / no-go for onboarding.
