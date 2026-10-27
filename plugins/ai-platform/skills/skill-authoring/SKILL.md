---
name: skill-authoring
description: Write or review a Claude Code skill or plugin for an internal marketplace - SKILL.md structure, trigger description, plugin.json and marketplace.json entries. Use when the user wants to package a team's know-how as a reusable skill or plugin.
---

# Authoring skills and plugins for a marketplace

## Skill structure

```
plugins/<plugin>/
  .claude-plugin/plugin.json
  skills/<skill-name>/SKILL.md
  skills/<skill-name>/reference.md   # optional, loaded only when needed
  skills/<skill-name>/scripts/       # optional helpers
```

`SKILL.md` starts with frontmatter:

```markdown
---
name: <kebab-case, matches the folder>
description: <what it does>. Use when <the situations and words that should trigger it>.
---
```

## The description decides everything

Claude sees only the description until the skill is invoked. Write it as: capability + "Use when" + the concrete triggers users actually say (product names, error messages, verbs). Avoid vague words like "helps with". Keep it under ~250 characters.

## The body

- Lead with the goal and any hard rules (e.g. read-only, ask before destructive actions).
- Give a procedure the model can follow, branching on what it finds.
- Include the exact commands, queries or templates the team uses. That's the knowledge Claude doesn't have.
- End with what the output must look like.
- Move long reference material into separate files and link them, so the main file stays short.
- Don't restate things Claude already knows well; spend the words on company-specific context.

## Plugin and marketplace

- `plugin.json`: `name`, `description`, `author`, `keywords`. Omit `version` to let every commit be a new version, or set it and bump it on each release.
- Add an entry to `.claude-plugin/marketplace.json` with `name` and `source: "./plugins/<plugin>"`.
- Validate with `claude plugin validate .` before pushing.

## Review checklist

1. Would the description trigger on the three most common ways people ask for this?
2. Does it avoid triggering on unrelated requests?
3. Can a new engineer follow the body without asking anyone?
4. Are destructive steps gated?
5. Is there an owner to maintain it?
