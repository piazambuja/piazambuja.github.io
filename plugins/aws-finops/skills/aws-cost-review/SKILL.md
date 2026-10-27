---
name: aws-cost-review
description: Review AWS costs from Cost Explorer/CUR exports, the AWS CLI or Terraform, and produce a prioritised savings plan with estimates. Use when the user asks why the AWS bill is high, how to reduce cloud spend, or to review costs for an account.
---

# AWS cost review

Read-only. Never stop, delete or modify resources; propose changes and let the user apply them.

## 1. Get the data

In order of preference:
1. A CUR / Cost Explorer CSV the user provides.
2. AWS CLI (read-only credentials):
   ```bash
   aws ce get-cost-and-usage --time-period Start=<YYYY-MM-01>,End=<YYYY-MM-01> \
     --granularity MONTHLY --metrics UnblendedCost \
     --group-by Type=DIMENSION,Key=SERVICE
   aws ce get-rightsizing-recommendation --service AmazonEC2
   aws ce get-savings-plans-purchase-recommendation --savings-plans-type COMPUTE_SP \
     --term-in-years ONE_YEAR --payment-option NO_UPFRONT --lookback-period-in-days SIXTY_DAYS
   ```
3. Terraform/IaC to estimate what is provisioned.

Look at three months to separate trend from spikes.

## 2. Find the drivers

Rank services by cost and by month-over-month growth. The usual suspects:

- **EC2/EKS**: low utilisation instances, on-demand where Spot fits (stateless, batch, CI), old generations (move to Graviton/current gen), oversized node groups, idle dev clusters running 24/7.
- **Data transfer**: NAT Gateway processing (add VPC endpoints for S3/DynamoDB/ECR), cross-AZ traffic between chatty services, egress to the internet.
- **EBS**: unattached volumes, old snapshots, gp2 → gp3.
- **S3**: no lifecycle rules, versioned buckets keeping old versions forever, wrong storage class.
- **RDS/Aurora**: oversized, Multi-AZ on non-prod, idle replicas, storage I/O on Aurora standard vs I/O-Optimized.
- **CloudWatch**: high-cardinality custom metrics, verbose logs without retention.
- **Bedrock/AI**: model choice per use case, prompt caching, batch inference for offline work.

## 3. Commitments

Only after rightsizing: Compute Savings Plans for the steady baseline, sized to the minimum stable usage, not the average.

## 4. Allocation

Check tag coverage (team, service, env). Without it, nobody owns the cost. Recommend a tag policy and cost allocation tags.

## Output

A table ordered by estimated monthly savings: finding, evidence, action, estimated savings, effort (low/med/high), risk. Then quick wins (this week), medium-term work, and governance (tags, budgets, anomaly detection). State assumptions behind each estimate.
