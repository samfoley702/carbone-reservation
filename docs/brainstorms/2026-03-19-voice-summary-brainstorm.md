# Voice Reservation Summary & Database Fix

**Date:** 2026-03-19
**Issue:** #22
**Status:** Brainstorm complete

## What We're Building

Two changes to the voice "Talk" reservation flow:

### 1. Visual Summary Card During Voice Call

Before the voice agent submits a reservation, it will display a visual summary card in the `VoiceOrbModal` showing all collected details (guest name, phone, location, date, party size, time slot, special notes). The agent reads the details back verbally while the card is visible on-screen for reference.

- **Timing:** Appears while the voice agent is still connected, before submission
- **Confirmation:** Voice-only — the agent submits after verbal confirmation, no button needed
- **Live updates:** If the user corrects a detail verbally, the agent re-calls the tool and the card updates in real-time
- **Visual style:** Match the existing summary/review patterns used in the Type flow (`ChatEngine` step 7) and Form flow (`StepConfirmation`)

### 2. Fix Database Logging for Voice Submissions

The voice flow's `submitReservation` client tool may not be successfully saving reservation data to Neon Postgres. Investigate and fix so voice submissions reliably persist.

## Why This Approach

**Approach chosen: New `showReservationSummary` client tool (Approach A)**

The ElevenLabs voice agent already uses client tools (`submitReservation`). Adding a second tool (`showReservationSummary`) creates a clean two-step flow:

1. Agent collects all details via conversation
2. Agent calls `showReservationSummary` → visual card appears, agent reads back details
3. User confirms verbally (or requests corrections → agent re-calls tool with updated data)
4. Agent calls `submitReservation` → data saved to database

**Why not the alternatives:**
- **Two-phase submit (B):** Overloads `submitReservation` with display responsibility, harder to handle corrections cleanly
- **Transcript parsing (C):** Fragile NLP parsing of free-form speech, can't guarantee accuracy vs. the structured data the agent already has

## Key Decisions

- **New client tool** `showReservationSummary` added to `VoiceAgent.tsx` alongside existing `submitReservation`
- **Summary card renders inside `VoiceOrbModal`** overlay, positioned below or beside the voice orb
- **No confirm button** — the voice agent handles confirmation verbally and decides when to call `submitReservation`
- **Card updates live** when the agent re-calls `showReservationSummary` with corrected parameters
- **Same data shape** as existing `ReservationData` / `SubmitReservationSchema`
- **Database fix** investigated and resolved as part of this same PR

## Open Questions

- Does the ElevenLabs agent's system prompt need updating to instruct it to call `showReservationSummary` before `submitReservation`? (Likely yes — this is configured in the ElevenLabs dashboard, not in our codebase)
- Should the summary card persist after submission as part of the success state, or disappear?
