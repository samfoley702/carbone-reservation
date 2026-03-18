---
status: pending
priority: p3
issue_id: "009"
tags: [code-review, validation, data-quality, voice-agent]
dependencies: ["002"]
---

# Phone Field Validation Inconsistency Between Voice Zod Schema and Text Form

## Problem Statement

The voice Zod schema validates `phone` as `z.string().max(30)` — accepting any string up to 30 chars including `"abc"` or `"N/A"`. The text form uses a regex check (`/^[\+]?[\d\s\-\(\)]{10,}$/`) that enforces numeric format. Voice-submitted reservations can contain structurally invalid phone numbers that would be rejected by the text form.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx` line 33
- **Text form validation:** `lib/validateReservation.ts` line 9 (regex-based)
- **Flagged by:** security-sentinel (P3)

## Proposed Solutions

### Option A — Add regex to Zod schema
```ts
phone: z.string().regex(/^[\+]?[\d\s\-\(\)]{10,}$/).max(30),
```
**Effort:** Trivial. **Risk:** Low — but may cause the agent to retry phone collection more often.

### Option B — Also add regex check server-side
Add the same regex to `/api/reservations/route.ts` so the server enforces format regardless of call path.
**Pros:** Defense in depth.
**Cons:** More changes.
**Effort:** Small.

## Recommended Action

Option A + Option B together for full consistency.

## Acceptance Criteria

- [ ] Voice Zod schema phone validation matches text form constraint
- [ ] Server-side phone validation covers both paths

## Work Log

- 2026-03-18: Identified by security-sentinel in PR #17 review
