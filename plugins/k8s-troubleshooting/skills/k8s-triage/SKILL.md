---
name: k8s-triage
description: Triage a broken Kubernetes workload (CrashLoopBackOff, OOMKilled, ImagePullBackOff, Pending, failing probes, 5xx from a Service). Use when a pod, deployment or service is unhealthy and the user wants to find the cause.
---

# Kubernetes workload triage

Work from symptom to cause with read-only commands first. Never delete, restart or scale anything until the cause is understood and the user agrees.

## 1. Establish context

- Confirm the cluster and namespace: `kubectl config current-context` and the namespace the user means. If the context looks like production, say so before running anything.
- Get the picture in one shot:
  ```bash
  kubectl get pods -n <ns> -o wide
  kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -30
  ```

## 2. Branch on the pod status

**Pending**
- `kubectl describe pod <pod>` and read the Events block.
- `Insufficient cpu/memory` → requests too high or cluster full; check `kubectl top nodes` and the autoscaler (Karpenter/Cluster Autoscaler) logs.
- `didn't match node affinity/selector` or `untolerated taint` → scheduling constraints.
- `pod has unbound PersistentVolumeClaims` → check the PVC, StorageClass and, on EKS, that the volume's AZ matches a node's AZ.

**ImagePullBackOff / ErrImagePull**
- Typo in image/tag, tag no longer exists, or registry auth (imagePullSecrets, IRSA/node role for ECR, ECR in another account).

**CrashLoopBackOff**
- Logs of the *previous* container: `kubectl logs <pod> -c <container> --previous`.
- Exit code from `kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[*].lastState}'`:
  - `137` with reason `OOMKilled` → memory limit too low or a leak; compare limit vs `kubectl top pod` and the app's heap settings (JVM `-XX:MaxRAMPercentage`, Node `--max-old-space-size`).
  - `137` without OOMKilled → killed by liveness probe or eviction.
  - `1`/`2` → application error; read the logs, then check config: env vars, mounted ConfigMaps/Secrets, missing files.
- Check whether the liveness probe is killing a slow starter: initialDelaySeconds / startupProbe.

**Running but not Ready / Service returning 5xx**
- Readiness probe failures in `describe`.
- `kubectl get endpointslices -n <ns> -l kubernetes.io/service-name=<svc>`: no endpoints means the selector doesn't match pod labels or no pod is Ready.
- Port mismatch: Service `targetPort` vs container port.
- From inside the cluster: `kubectl run tmp --rm -it --image=nicolaka/netshoot -- bash` then `curl` the service and `dig` its DNS name.
- Ingress/ALB: target group health in AWS, ingress annotations, security groups.

**Evicted / node problems**
- `kubectl describe node <node>`: MemoryPressure, DiskPressure, PIDPressure.
- Look for noisy neighbours without limits on the same node.

## 3. Correlate with change

Most incidents follow a change. Check `kubectl rollout history deploy/<name>`, the image tag currently running vs the previous ReplicaSet, recent ConfigMap/Secret edits and recent cluster upgrades.

## 4. Report

Reply with:
1. **Cause** — one sentence, with the evidence (log line, event, exit code).
2. **Fix** — the smallest change that resolves it, as a manifest diff or command.
3. **Prevent** — one item (alert, probe tuning, resource request, policy).

If the evidence is inconclusive, say what is missing and the next command to run rather than guessing.
