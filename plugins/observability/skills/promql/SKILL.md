---
name: promql
description: Write, explain and fix PromQL queries and recording rules, and review them for correctness and cardinality. Use when the user asks for a Prometheus/Grafana/Mimir/Thanos query or a query gives unexpected results.
---

# PromQL helper

## Writing queries

- Find the metric type first. Counters (`_total`) always go through `rate()`/`increase()`; never `sum()` a raw counter.
- `rate()` before `sum()`: `sum by (svc) (rate(x_total[5m]))`, never `rate(sum(x_total)[5m])`.
- The range should be at least 4× the scrape interval (with 30s scrapes, use `[2m]` or more).
- Percentiles from histograms keep the `le` label:
  ```promql
  histogram_quantile(0.99, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))
  ```
  Native histograms: `histogram_quantile(0.99, sum by (route) (rate(http_request_duration_seconds[5m])))`.
- Ratios: aggregate numerator and denominator with the same `by` clause.
- Joins: use `on()`/`ignoring()` with `group_left` to pull labels from info metrics like `kube_pod_info`.
- Absent data: `absent()` or `absent_over_time()` for "is the target dead" alerts.

## Review checklist

1. Counter used without `rate`? Gauge used with `rate`?
2. Aggregation drops a label the alert or dashboard needs?
3. `histogram_quantile` without `le` in the `by`? Averaging percentiles across instances (wrong)?
4. Regex matchers on high-cardinality labels in hot dashboards?
5. Range too short for the scrape interval?
6. Should this be a recording rule (used in several panels/alerts, or expensive)?

## Cardinality

When the user suspects a cardinality problem:
```promql
topk(10, count by (__name__) ({__name__=~".+"}))
topk(10, count by (le) (http_request_duration_seconds_bucket))
```
Look for labels carrying user ids, full URLs, request ids or timestamps. Recommend dropping them with `metric_relabel_configs` or fixing the instrumentation.

Always explain what the final query returns in one sentence, including the unit.
