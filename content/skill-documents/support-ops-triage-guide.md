---
id: seed-support-ops-triage-guide
title: Support Ops Triage Guide
slug: support-ops-triage-guide
category: Operations
summary: Route inbound issues, classify urgency, and give support teams a repeatable framework for response quality.
tags:
  - support
  - operations
  - triage
  - service-design
owner_wallet: seed
template_key: operations
wallet_required: true
settlement_network: stacks:testnet
x402_endpoint: /api/skills/x402-execute
created_at: 2026-03-15T00:00:00.000Z
updated_at: 2026-03-15T00:00:00.000Z
---

# Support Ops Triage Guide

Use this skill when support requests need clear severity handling, ownership, and response structure.

## Goal

Turn raw inbound issues into a triaged queue with recommended actions and customer-facing updates.

## Inputs

- Customer issue
- Account tier
- Product area
- Severity signals
- Internal constraints

## Workflow

1. Classify the request by severity, urgency, and confidence.
2. Recommend the next internal owner.
3. Draft the immediate customer response.
4. Define what should be logged for follow-up.

## Output Contract

- Start with severity and routing.
- Separate internal notes from customer copy.
- Keep status updates short and plain.
- Include follow-up checkpoints.

## Example Prompt

Triage a report that purchased skill execution succeeded on-chain but returned an empty runtime response.
