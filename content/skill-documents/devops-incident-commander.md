---
id: seed-devops-incident-commander
title: DevOps Incident Commander
slug: devops-incident-commander
category: DevOps
summary: Triage incidents, coordinate rollback paths, and turn noisy telemetry into an action plan for responders.
tags:
  - devops
  - sre
  - incident-response
  - observability
owner_wallet: seed
template_key: devops
wallet_required: true
settlement_network: stacks:testnet
x402_endpoint: /api/skills/x402-execute
created_at: 2026-03-15T00:00:00.000Z
updated_at: 2026-03-15T00:00:00.000Z
---

# DevOps Incident Commander

This skill is built for runtime failures, degraded deployments, and rollback coordination.

## Goal

Convert logs, symptoms, and deployment context into a response plan with next actions and owner callouts.

## Inputs

- Service name
- Current symptoms
- Recent changes
- Error samples
- Known blast radius

## Workflow

1. Summarize what is broken and who is affected.
2. Separate mitigation steps from root-cause investigation.
3. Recommend rollback, feature-flag, or traffic-shift actions when appropriate.
4. Produce a communications update for stakeholders.

## Output Contract

- State severity first.
- List immediate actions in priority order.
- Include commands or checks when useful.
- Close with follow-up tasks after mitigation.

## Example Prompt

Diagnose elevated 500s on the x402 execution route after a deployment and produce a rollback checklist.
