---
name: postmortem
description: Write a blameless postmortem from incident notes, chat logs, timelines and graphs, with contributing factors and concrete action items. Use after an incident or when the user asks for an incident review or RCA.
---

# Blameless postmortem

## Principles

- Describe systems and decisions, not people's faults. "The deploy pipeline allowed X", not "João deployed X".
- Ask "how did it make sense at the time?" for every human decision.
- There is rarely a single root cause; list contributing factors.
- Action items must be specific, owned and dated. "Improve monitoring" is not an action item.

## Gather

From what the user provides, extract: detection time, start time of impact, mitigation time, resolution time, the actions taken and who decided them. If times are missing, mark them as unknown instead of guessing.

## Template

```markdown
# <Title: what users experienced> — <date>

**Severity:** SEV<n>   **Duration of impact:** <hh:mm>   **Status:** draft

## Summary
Three sentences: what happened, impact, how it was resolved.

## Impact
Users/requests affected, business impact, SLO budget consumed.

## Timeline (UTC-3)
| Time | Event |
| --- | --- |

## Detection
How we found out. Time to detect. Did alerting work?

## Contributing factors
- Technical
- Process
- Detection/response

## What went well
## Where we got lucky

## Action items
| Action | Type (prevent / detect / mitigate) | Owner | Due |
| --- | --- | --- | --- |
```

## Quality check before handing over

- Each contributing factor has at least one action item, or an explicit reason why not.
- At least one "detect" action if time to detect was long.
- The summary is readable by someone outside engineering.
- No blame language: search for "should have", "failed to", "forgot", "careless" and rewrite.

Key metrics to include when available: time to detect, time to mitigate, time to resolve.
