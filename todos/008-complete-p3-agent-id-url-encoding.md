---
status: pending
priority: p3
issue_id: "008"
tags: [code-review, security, correctness]
dependencies: []
---

# `ELEVENLABS_AGENT_ID` Not URL-Encoded in Query String

## Problem Statement

In `lib/elevenlabs.ts`, the agent ID is interpolated directly into a URL without `encodeURIComponent`. If the env var accidentally contains special characters (`&`, `#`, `=`), the URL silently misbehaves rather than failing with a clear error.

## Findings

- **File:** `lib/elevenlabs.ts` line 30
- **Current:** `` `https://api.elevenlabs.io/...?agent_id=${ELEVENLABS_AGENT_ID}` ``
- **Flagged by:** security-sentinel (P3)

## Proposed Solutions

### Option A — Wrap with `encodeURIComponent` (Recommended)
```ts
`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(ELEVENLABS_AGENT_ID)}`
```
**Effort:** Trivial (1 word). **Risk:** None.

## Recommended Action

Option A.

## Acceptance Criteria

- [ ] Agent ID wrapped with `encodeURIComponent`

## Work Log

- 2026-03-18: Identified by security-sentinel in PR #17 review
