---
name: alert-review
description: Audit an alerting setup (Prometheus rules, Alertmanager, Grafana, Datadog or CloudWatch alarms) for noise, missing coverage and missing runbooks. Use when on-call is noisy, alerts are ignored, or the user asks to review their alerts.
---

# Alert review

Goal: every page is urgent, actionable and needs a human. Everything else is a ticket, a dashboard or deleted.

## Inputs

Read the alert definitions in the repo. If available, also get firing history (Alertmanager/PagerDuty/Opsgenie export) for the last 30 days. Without history, review definitions only and say so.

## For each alert, decide

| Question | If "no" |
| --- | --- |
| Does it describe user-facing impact or imminent impact? | Downgrade to ticket or remove |
| Is there a clear action for the responder? | Add a runbook or remove |
| Did it fire and lead to action in the last 30 days? | Candidate for removal |
| Does it have `for:` long enough to skip blips? | Add `for:` |
| Is the threshold based on data, not a guess? | Re-derive from history |
| Does it duplicate another alert for the same cause? | Merge or add inhibition |

Symptom alerts (error rate, latency, SLO burn) should page. Cause alerts (CPU high, pod restarted, disk 80%) usually should not, except saturation that will cause an outage soon (disk full in < 4h via `predict_linear`).

## Alertmanager hygiene

- Grouping by `alertname, cluster, namespace/service` so one incident is one notification.
- Inhibition: cluster or node down inhibits the per-pod alerts below it.
- Routing: severity `page` to the on-call tool, `ticket` to a channel or queue, never both.
- Every alert has `summary`, `description` with the values, `runbook_url` and an owner label.

## Output

1. Summary numbers: total alerts, pages, proposed removals/downgrades.
2. A table: alert, current severity, verdict (keep / tune / downgrade / delete / merge), reason.
3. Missing coverage: user journeys with no symptom alert.
4. Patches for the changes.
