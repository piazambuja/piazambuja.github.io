---
name: slo-design
description: Define SLIs and SLOs for a service and generate multi-window, multi-burn-rate alerts (Prometheus rules). Use when the user wants to create or review SLOs, error budgets, or replace threshold alerts with SLO-based alerting.
---

# SLO design

## 1. Start from the user journey

Ask (or infer from the code/config) what the service's users actually do: e.g. "authorize a payment", "load the statement page". Pick 1–3 journeys. An SLO per journey beats an SLO per microservice.

## 2. Choose SLIs

Express every SLI as good events / valid events:

| Type | Good event | Typical source |
| --- | --- | --- |
| Availability | request not answered with 5xx (and not timed out) | ingress/ALB, service mesh, app metrics |
| Latency | request served under a threshold, e.g. 300 ms | histogram buckets |
| Freshness | data updated within N minutes | pipeline timestamps |
| Correctness | output matches expectation | probes / reconciliation jobs |

Measure as close to the user as possible (load balancer or mesh beats app-internal). Exclude 4xx from "bad" unless the service caused them.

## 3. Set the objective

- Base it on what users tolerate and on historical performance, not on "five nines".
- Window: 28 or 30 days rolling.
- Error budget = 1 − SLO. At 99.9% over 30 days that is ~43 minutes of full outage.
- Write down the error-budget policy: what happens when it is spent (feature freeze, reliability work prioritised).

## 4. Alerts: multi-window, multi-burn-rate

Use the standard pairs (for a 30-day window):

| Severity | Burn rate | Long window | Short window | Budget consumed |
| --- | --- | --- | --- | --- |
| page | 14.4 | 1h | 5m | 2% |
| page | 6 | 6h | 30m | 5% |
| ticket | 3 | 1d | 2h | 10% |
| ticket | 1 | 3d | 6h | 10% |

Template (availability, SLO 99.9%):

```yaml
groups:
- name: slo-checkout
  rules:
  - record: slo:sli_error:ratio_rate5m
    expr: |
      sum(rate(http_requests_total{job="checkout",code=~"5.."}[5m]))
      / sum(rate(http_requests_total{job="checkout"}[5m]))
  # repeat the recording rule for 30m, 1h, 2h, 6h, 1d, 3d
  - alert: CheckoutErrorBudgetBurnFast
    expr: |
      slo:sli_error:ratio_rate1h > (14.4 * 0.001)
      and slo:sli_error:ratio_rate5m > (14.4 * 0.001)
    labels: {severity: page}
    annotations:
      summary: "Checkout is burning its error budget 14x too fast"
      runbook_url: "<link>"
```

If the stack uses Sloth or Pyrra, generate their spec instead of raw rules.

## 5. Output

Deliver: the journeys, SLI definitions with the exact query, the objective and its justification, the alert rules, and a dashboard outline (SLI over time, budget remaining, burn rate). Point out SLIs that can't be measured yet and what instrumentation is missing.
