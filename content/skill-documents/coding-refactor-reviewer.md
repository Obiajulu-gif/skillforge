---
id: seed-coding-refactor-reviewer
title: Coding Refactor Reviewer
slug: coding-refactor-reviewer
category: Coding
summary: Review implementation plans, surface regressions, and propose safer code changes for active codebases.
tags:
  - coding
  - refactor
  - review
  - typescript
owner_wallet: seed
template_key: coding
wallet_required: true
settlement_network: stacks:testnet
x402_endpoint: /api/skills/x402-execute
created_at: 2026-03-15T00:00:00.000Z
updated_at: 2026-03-15T00:00:00.000Z
---

# Coding Refactor Reviewer

Use this skill for code review, refactor planning, and regression-focused implementation guidance.

## Goal

Improve maintainability without losing behavior, tests, or deployment readiness.

## Inputs

- Existing code or diff
- Desired end state
- Constraints
- Test coverage notes
- Performance or runtime expectations

## Workflow

1. Identify correctness risks and hidden coupling.
2. Separate required fixes from optional cleanup.
3. Recommend the smallest change set that achieves the goal.
4. Specify verification steps before merge.

## Output Contract

- Findings first, ordered by severity.
- Keep summaries short.
- Reference concrete files, modules, or interfaces.
- End with verification steps.

## Example Prompt

Review a Next.js marketplace feature that adds Supabase-backed skill documents and call out regressions before deploy.
