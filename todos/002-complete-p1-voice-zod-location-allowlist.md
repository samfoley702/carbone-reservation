---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, security, voice-agent, validation]
dependencies: []
---

# `location` Field Not Allowlist-Validated in Voice Zod Schema

## Problem Statement

`SubmitReservationSchema` in `VoiceAgent.tsx` validates `location` as `z.string()` with no constraint. The server-side `/api/reservations` route correctly validates against `VALID_LOCATIONS`, but the client-side schema should match. The mismatch has two concrete consequences:

1. When the ElevenLabs agent hallucinates a location (e.g. `"Sydney"`), Zod passes it, the POST is sent, the server returns 400, and the `submitReservation` tool catches a generic `"Server error"` — not the specific `"Validation failed."` string that is supposed to trigger the agent's retry prompt. The agent retry loop is silently broken.
2. The invalid location is written to `partialDataRef.current` before the server responds, meaning if the user switches to the text form immediately after a hallucinated-location attempt, the form receives a bad location (which `coercePartialData` will silently drop — correct behaviour, but a data-loss surprise).

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx` line 35
- **Current:** `location: z.string()`
- **Should be:** `location: z.enum([...VALID_LOCATIONS])`
- **Server validation:** `app/api/reservations/route.ts` enforces `VALID_LOCATIONS` from `types/reservation.ts`
- **Flagged by:** agent-native-reviewer (P1), security-sentinel (P3 — consistency)

## Proposed Solutions

### Option A — Import LOCATIONS and derive the enum (Recommended)
```ts
import { LOCATIONS } from "@/types/reservation";
// At schema definition time (module scope):
const LOCATION_CITIES = LOCATIONS.map((l) => l.city) as [string, ...string[]];

const SubmitReservationSchema = z.object({
  // ...
  location: z.enum(LOCATION_CITIES),
  // ...
});
```
**Pros:** Single source of truth — if `LOCATIONS` changes, Zod schema updates automatically. Self-documenting.
**Cons:** Minor — the `as [string, ...string[]]` cast is needed because `z.enum` requires a non-empty tuple type.
**Effort:** Small. **Risk:** None.

### Option B — Inline the valid values
```ts
location: z.enum(["New York", "Miami", "Las Vegas"]),
```
**Pros:** Simpler, no import needed.
**Cons:** Duplication — must stay in sync with `types/reservation.ts` manually.
**Effort:** Small. **Risk:** Drift over time.

## Recommended Action

Option A. Derive from the canonical `LOCATIONS` constant.

## Technical Details

- **Affected files:** `components/ChatWidget/VoiceAgent.tsx`
- **Change scope:** Add one import + change one line in `SubmitReservationSchema`

## Acceptance Criteria

- [ ] `location` field uses `z.enum` derived from `LOCATIONS`
- [ ] Invalid location causes `safeParse` to fail → tool returns `"Validation failed..."` → agent prompts retry
- [ ] Valid locations (e.g. `"New York"`) still pass validation

## Work Log

- 2026-03-18: Identified by agent-native-reviewer in PR #17 review
