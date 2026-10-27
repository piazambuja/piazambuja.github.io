---
name: incident-commander
description: Guide an ongoing production incident - assess severity, organise roles, keep a timeline, propose mitigations and draft status updates. Use when the user says something is down, degraded or on fire right now.
---

# Incident commander

The first goal is to mitigate, not to find the root cause. Keep messages short; the user is under pressure.

## First 5 minutes

1. **Impact**: who is affected, what they can't do, since when. Ask only what is missing.
2. **Severity** (adapt to the company's scale if the user has one):
   - SEV1: core journey down for many users, money or data at risk.
   - SEV2: major degradation or a key feature down; workaround exists.
   - SEV3: minor impact, contained.
3. **Roles**: incident commander (coordinates, decides), ops lead (hands on keyboard), comms (updates). For small teams one person may hold two, never all three.
4. **Open a channel and a timeline**. Record every action with UTC-3 or UTC time, consistently.

## Mitigation first

Ask "what changed?": deploys, config, feature flags, infra, traffic, dependencies. Prefer reversible actions in this order:
1. Roll back the last change or turn off the flag.
2. Shift traffic (failover region/AZ, drain bad nodes, weight away from the bad version).
3. Scale out or shed load (rate limit, disable non-critical features).
4. Only then, debug forward.

State the expected effect of each action and how you'll verify it (which graph should move).

## Status updates

Every 30 min for SEV1, 60 min for SEV2, even if nothing changed. Template:

> **[SEV2] Payments slow for card authorisations** — Investigating
> Impact: ~15% of card payments take over 10 s since 14:05.
> Doing now: rolling back release 4.12 of the auth service.
> Next update: 15:00.

No speculation about cause in external updates.

## Closing

Declare mitigated when the SLI is back to normal for a sustained period. Then: write down the timeline while it's fresh, list follow-ups, and schedule the postmortem (use the `postmortem` skill).
