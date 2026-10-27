---
name: resource-rightsizing
description: Recommend CPU and memory requests/limits for Kubernetes workloads from real usage (kubectl top, Prometheus, VPA recommendations). Use when pods are OOMKilled, throttled, over-provisioned, or when the user asks how to size requests and limits.
---

# Rightsizing requests and limits

## Gather usage

Prefer at least 7 days of data that includes a peak period.

```promql
# p95 CPU (cores) per container over 7d
quantile_over_time(0.95, sum by (namespace, pod, container) (rate(container_cpu_usage_seconds_total{container!=""}[5m]))[7d:5m])

# max working-set memory per container over 7d
max_over_time(container_memory_working_set_bytes{container!=""}[7d])

# CPU throttling ratio
sum by (namespace, pod, container) (rate(container_cpu_cfs_throttled_periods_total[5m]))
/ sum by (namespace, pod, container) (rate(container_cpu_cfs_periods_total[5m]))
```

Without Prometheus, use `kubectl top pod --containers` sampled at peak, and say the recommendation is lower confidence. If VPA runs in recommendation mode, read `kubectl describe vpa`.

## Rules of thumb

- **CPU request** ≈ p95 usage. It drives scheduling and fair share.
- **CPU limit**: often better unset for latency-sensitive services, since CFS throttling hurts tail latency. Keep it where the platform requires limits or for batch/noisy workloads. Throttling above ~10% at peak is a signal.
- **Memory request** ≈ max working set + 15–25% headroom.
- **Memory limit** = memory request for most services (Guaranteed for memory, predictable OOM behavior). Memory is not compressible: being over the limit means OOMKilled.
- Runtime awareness: JVM heap should be a percentage of the limit (`-XX:MaxRAMPercentage=70`), Node `--max-old-space-size` below the limit, Go `GOMEMLIMIT` around 90% of the limit.
- Keep HPA in mind: HPA on CPU utilization is relative to the *request*. Changing requests changes when it scales.

## Output

A table per container: current request/limit, observed p95/max, recommended request/limit, and the reason. Then the YAML patch. Flag the ones where the change is large (more than 2× either way) so the user rolls them out gradually.
