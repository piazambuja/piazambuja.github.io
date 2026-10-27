---
name: llm-gateway-design
description: Design or review an internal LLM gateway that centralises model access (Amazon Bedrock, Anthropic, OpenAI and others) with per-team auth, cost attribution, quotas, observability and guardrails. Use when a company wants one controlled way for teams and agents to call LLMs.
---

# LLM gateway design

An LLM gateway is platform engineering: one paved road so every team gets models fast, and the company keeps control of cost, security and data.

## Requirements to pin down first

- Consumers: internal apps, agents, IDE/coding tools, batch jobs. Expected RPS and tokens/day.
- Providers and models: Bedrock (which regions, cross-region inference), direct vendor APIs, self-hosted.
- Data rules: what can leave the account/region, PII handling, retention, logging of prompts allowed or not.
- Who pays: cost centre per team, per application, per user.

## Reference architecture

1. **Entry**: OpenAI-compatible and/or Anthropic-compatible API so existing SDKs work. Deployed on EKS/ECS behind an internal ALB, or a managed option (LiteLLM, Portkey, Kong AI Gateway, Envoy AI Gateway). Build only the parts that are a real differentiator.
2. **Identity**: one virtual key per application or team, mapped to an owner and cost centre. Prefer workload identity (IRSA/OIDC) over long-lived keys for services.
3. **Routing**: model aliases (`chat-default`, `code-large`) so the platform can swap underlying models; fallback chains across regions/providers on throttling or 5xx; Bedrock cross-region inference profiles.
4. **Quotas**: tokens per minute and budget per key; soft alert at 80%, hard stop or downgrade at 100%.
5. **Cost attribution**: record input/output/cache tokens per request with team, app, model; price table versioned in the gateway; export to the data warehouse and a per-team dashboard. Bedrock application inference profiles plus cost allocation tags help reconcile with the AWS bill.
6. **Observability**: RED metrics per model and per team, time-to-first-token, tokens/s, provider error and throttle rates, traces with OpenTelemetry GenAI semantic conventions. Log prompts only where policy allows, with redaction.
7. **Guardrails**: PII redaction, prompt-injection and content filters (Bedrock Guardrails or equivalent), allow-list of models per data classification.
8. **Caching**: provider prompt caching surfaced to clients; optional exact-match response cache for deterministic calls.

## Review checklist

- Can a team self-serve a key in minutes, with an owner and budget attached?
- Can finance see cost per team for last month without a manual spreadsheet?
- What happens when a region throttles? Tested?
- Is there a kill switch per key and per model?
- Are SLOs defined for the gateway itself (availability, added latency p99)?
- Are streaming responses handled end to end (timeouts, buffering at the load balancer)?

## Output

An architecture description (and diagram in Mermaid if useful), the decisions with trade-offs, a phased rollout (pilot team → paved road → mandatory), and the SLOs and dashboards for the gateway.
