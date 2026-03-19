---
status: complete
priority: p2
issue_id: "013"
tags: [code-review, architecture, data-quality]
dependencies: []
---

# API Route Location Allowlist Is Hardcoded — Diverges from Canonical LOCATIONS Constant

## Problem Statement

`app/api/reservations/route.ts` defines its own hardcoded `VALID_LOCATIONS` string array, independent of `types/reservation.ts`'s `LOCATIONS` constant. `VoiceAgent.tsx` and `coercePartialData.ts` both derive their city lists from `LOCATIONS` automatically. If a new city is added to `LOCATIONS`, the voice and coercion paths update but the API route does not — allowing invalid locations through the final database gate.

The API route is the last validation layer before data reaches Postgres, making this the highest-risk instance of the divergence.

## Findings

- **File:** `app/api/reservations/route.ts`, lines 38–48 (hardcoded `VALID_LOCATIONS`)
- **Correct pattern:** `components/ChatWidget/VoiceAgent.tsx`, line 31 (`LOCATIONS.map((l) => l.city)`)
- **Flagged by:** architecture-strategist (Medium)

## Proposed Solutions

### Option A — Derive from LOCATIONS in the API route
```ts
import { LOCATIONS } from "@/types/reservation";
const VALID_LOCATIONS = LOCATIONS.map((l) => l.city);
```
Replace the hardcoded array with this derivation. One import, one line change.
**Effort:** Trivial. **Risk:** None — the values are identical today.

### Option B — Export a shared constant from types/reservation.ts
Export `VALID_CITIES` from `types/reservation.ts` and import it everywhere:
```ts
// types/reservation.ts
export const VALID_CITIES = LOCATIONS.map((l) => l.city) as [string, ...string[]];
```
**Pros:** Single derivation, usable in Zod enums directly.
**Cons:** Minor change to the types file.

## Recommended Action

Option B — export `VALID_CITIES` from the canonical source. Eliminates all three derivation sites.

## Acceptance Criteria

- [ ] `app/api/reservations/route.ts` no longer has a hardcoded location array
- [ ] Adding a city to `LOCATIONS` automatically propagates to API validation, Zod schema, and coercion

## Work Log

- 2026-03-19: Identified by architecture-strategist in review
