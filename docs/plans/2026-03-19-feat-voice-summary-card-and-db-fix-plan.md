---
title: "feat: Voice reservation summary card and database fix"
type: feat
date: 2026-03-19
issue: 22
brainstorm: docs/brainstorms/2026-03-19-voice-summary-brainstorm.md
---

# feat: Voice reservation summary card and database fix

## Overview

Add a visual summary card to the voice "Talk" reservation flow so users can see their collected details on-screen before the agent submits. Also fix silent validation failures that prevent voice reservations from saving to the database.

## Problem Statement

1. **No visual confirmation:** The voice flow submits reservation data without ever showing the user what was captured. The Type and Form flows both have review screens (ChatEngine step 7, StepConfirmation), but the voice flow shows only a success message.

2. **Silent database failures:** The `submitReservation` client tool's Zod validation can fail silently — it returns an error string to the ElevenLabs agent but logs nothing client-side. The agent may also pass data in unexpected formats (e.g., `"NYC"` instead of `"New York"`), causing invisible rejections.

## Proposed Solution

### 1. New `showReservationSummary` client tool

Add a second ElevenLabs client tool that renders a summary card in the VoiceAgent UI. The two-step flow becomes:

1. Agent collects details via conversation
2. Agent calls `showReservationSummary` → card appears on-screen, agent reads back details verbally
3. User confirms or requests corrections → agent re-calls tool with updated data (card updates live)
4. Agent calls `submitReservation` → data saved to database

### 2. Shared `ReservationSummaryCard` component

Extract the review card pattern from ChatEngine's `buildReviewRows` (ChatEngine.tsx:309-325) into a shared component. Both ChatEngine step 7 and VoiceAgent will import it.

### 3. Location alias normalization

Add a `normalizeLocation` utility that maps common voice-agent aliases (`"NYC"` → `"New York"`, `"Vegas"` → `"Las Vegas"`, etc.) and apply it in both client tools and `coercePartialData`.

### 4. Validation failure logging

Add `console.warn` with Zod error details (phone redacted) to `submitReservation` so failures are visible in dev tools and production logs.

## Technical Approach

### Files to create

- `components/ReservationSummaryCard.tsx` — shared summary card component
- `lib/normalizeLocation.ts` — location alias mapping utility

### Files to modify

- `components/ChatWidget/VoiceAgent.tsx` — add `showReservationSummary` client tool, summary state, logging, apply `normalizeLocation`
- `components/ChatWidget/ChatEngine.tsx` — replace inline `buildReviewRows` + card markup with shared `ReservationSummaryCard`
- `lib/coercePartialData.ts` — apply `normalizeLocation` before validation

### Implementation details

**`showReservationSummary` client tool:**
- Uses same Zod schema as `submitReservation` but with `normalizeLocation` applied first
- On success: stores validated data in a `summaryData` state variable (not in the transcript messages array) and updates `partialDataRef` for Talk-to-Type handoff
- On validation failure: returns field-specific error messages listing valid values (e.g., `"Invalid location 'NYC'. Valid locations are: New York, Miami, ..."`)
- Return on success: `"Summary displayed. Please read back the details and ask the guest to confirm or request changes."`

**Summary card rendering:**
- Rendered from `summaryData` state, positioned within the VoiceAgent transcript area but **not** as a message bubble — it's a separate stateful element that updates on re-invocation rather than appending
- Reuses the existing visual style: bordered card, Oswald labels (uppercase, muted), Cormorant values (cream), rows separated by bottom borders
- Persists after successful submission as a "receipt" above the success message
- Time slot displays human-readable labels (e.g., `"Early Seating — 5:30-7:00 PM"`) mapped from enum values

**`normalizeLocation` utility:**
```typescript
// lib/normalizeLocation.ts
const LOCATION_ALIASES: Record<string, string> = {
  "nyc": "New York", "ny": "New York", "new york city": "New York",
  "vegas": "Las Vegas", "lv": "Las Vegas",
  "hk": "Hong Kong",
  // ... other common aliases
};

export function normalizeLocation(input: string): string {
  return LOCATION_ALIASES[input.toLowerCase().trim()] ?? input;
}
```

**Validation logging:**
```typescript
// In submitReservationTool, after Zod parse failure:
if (!parsed.success) {
  console.warn("submitReservation validation failed:", parsed.error.flatten(), {
    rawParams: { ...params as Record<string, unknown>, phone: "[REDACTED]" },
  });
  return "Validation failed. ...";
}
```

## Acceptance Criteria

- [x] `showReservationSummary` client tool registered in VoiceAgent alongside `submitReservation`
- [x] Summary card renders on-screen when the voice agent calls `showReservationSummary`
- [x] Card updates in place (not appended) when the tool is re-called with corrected data
- [x] `partialDataRef` is updated by `showReservationSummary` so Talk-to-Type handoff preserves displayed data
- [x] Summary card persists after successful submission as a receipt
- [x] Location aliases (NYC, Vegas, HK, etc.) are normalized before validation in both tools and `coercePartialData`
- [x] Zod validation failures in `submitReservation` are logged with field-specific details (phone redacted)
- [x] Shared `ReservationSummaryCard` component used by both VoiceAgent and ChatEngine
- [x] Summary card visual style matches existing review patterns (bordered card, Oswald/Cormorant fonts, row dividers)
- [x] Time slot enum values display as human-readable labels in the summary card

## Edge Cases and Known Risks

**Agent skips summary:** The ElevenLabs agent may call `submitReservation` without calling `showReservationSummary` first. We allow this (cannot enforce LLM tool-call ordering), but the agent's system prompt should instruct the two-step flow. This is configured in the ElevenLabs dashboard, not our codebase.

**Rapid re-invocation:** If `showReservationSummary` is called twice quickly, the second call overwrites `summaryData` state — no duplicate cards since we render from state, not transcript.

**Session disconnect with summary visible:** The summary card remains visible alongside the error state. The "Switch to typing" button preserves data via `partialDataRef`.

**Date format from agent:** The Zod schema expects `YYYY-MM-DD`. The ElevenLabs agent's system prompt must instruct it to provide dates in this format. Date normalization is out of scope for this PR.

## Out of Scope (Follow-up Issues)

- ChatEngine auto-advancing past pre-populated steps when `initialData` is provided (improves Talk-to-Type UX but is a separate concern)
- Client-side idle timeout for voice sessions
- Server-side logging endpoint for production observability
- Inline editing on the summary card (corrections are verbal-only)

## References

- Brainstorm: [docs/brainstorms/2026-03-19-voice-summary-brainstorm.md](docs/brainstorms/2026-03-19-voice-summary-brainstorm.md)
- ElevenLabs client tool pattern: [VoiceAgent.tsx:204-249](components/ChatWidget/VoiceAgent.tsx#L204-L249)
- Existing review card (ChatEngine): [ChatEngine.tsx:309-325](components/ChatWidget/ChatEngine.tsx#L309-L325)
- Existing review card (Form): [StepConfirmation.tsx:30-38](components/ReservationForm/steps/StepConfirmation.tsx#L30-L38)
- Data coercion utility: [coercePartialData.ts](lib/coercePartialData.ts)
- API validation: [reservations/route.ts](app/api/reservations/route.ts)
