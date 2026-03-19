---
status: complete
priority: p3
issue_id: "014"
tags: [code-review, validation, security]
dependencies: ["009"]
---

# Zod Schema Missing .max() Constraints — Inconsistent with Server-Side Limits

## Problem Statement

The `SubmitReservationSchema` in `VoiceAgent.tsx` validates voice agent output but is missing `.max()` constraints on several fields that the server enforces. This creates inconsistent validation layers: the client Zod schema accepts values the server will reject or truncate.

Specific gaps:
- `firstName` and `lastName`: no max in Zod; server caps at 100 chars
- `specialNote`: no max in Zod; server caps at 1000 chars

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx`, lines 33–42
- **Server constraints:** `app/api/reservations/route.ts` lines 25, 31–33
- **Flagged by:** security-sentinel (Medium), code-simplicity-reviewer

## Proposed Solutions

### Option A — Add .max() to match server constraints
```ts
const SubmitReservationSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().regex(/^[\+]?[\d\s\-\(\)]{10,}$/).max(30),
  location: z.enum(VALID_CITIES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  timeSlot: z.enum(["early", "prime", "late"]),
  specialNote: z.string().max(1000).optional(),
});
```
**Effort:** Trivial. **Risk:** Low — may cause the agent to retry if it provides overly long values.

## Recommended Action

Option A — align Zod schema with server limits for full consistency.

## Acceptance Criteria

- [ ] `firstName` and `lastName` capped at 100 chars in Zod schema
- [ ] `specialNote` capped at 1000 chars in Zod schema
- [ ] All Zod constraints match server-side validation constraints

## Work Log

- 2026-03-19: Identified by security-sentinel in review
