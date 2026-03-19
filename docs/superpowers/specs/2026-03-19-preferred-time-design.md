# Design: Replace Time Slot Enum with Specific Preferred Time

**Issue:** #26 — fix Time Slot mapping
**Date:** 2026-03-19

## Summary

Replace the three-tier time slot system (`early`, `prime`, `late`) with a 15-minute increment time picker allowing guests to request any specific time between 5:00 PM and 11:00 PM. This change spans the database, type system, form UI, chat UI, voice agent, API validation, and display components.

## Database

- Column renamed: `time_slot` → `preferred_time` (already executed)
- Column type: `TEXT NOT NULL` (unchanged)
- Stored values: `"5:00 PM"`, `"5:15 PM"`, … `"11:00 PM"` (12-hour format)
- Migration SQL: `ALTER TABLE reservation_requests RENAME COLUMN time_slot TO preferred_time;`

## Type System & Constants

**File:** `types/reservation.ts`

- Remove `TimeSlot` type (`"early" | "prime" | "late"`)
- Remove `TIME_SLOTS` array of `{ id, label, hours }` objects
- Add `PREFERRED_TIMES` — generated array of 25 time strings from `"5:00 PM"` to `"11:00 PM"` in 15-minute increments
- Rename `timeSlot: TimeSlot | null` → `preferredTime: string | null` in `ReservationData` interface

## UI — Time Picker

**Files:** `components/ReservationForm/steps/StepTime.tsx`, `components/ChatWidget/ChatEngine.tsx`

- Replace 3 button cards with scrollable list of 25 time options
- Each option is a button displaying the time (e.g., `"7:30 PM"`)
- Maintain existing Carbone aesthetic (card style, gold/cream colors, checkmark on selection)
- Clicking a time calls `onChange({ preferredTime: "7:30 PM" })`
- Special requests textarea remains on the same step

## API Validation

**File:** `app/api/reservations/route.ts`

- Rename `timeSlot` → `preferredTime` in request body destructuring
- Replace `["early", "prime", "late"].includes(timeSlot)` with validation that `preferredTime` matches a valid 15-minute increment between 5:00–11:00 PM
- Update SQL INSERT to use `preferred_time` column name and `preferredTime` value

## Voice Agent (Code)

**File:** `components/ChatWidget/VoiceAgent.tsx`

- Update Zod schema: replace `timeSlot: z.enum(["early", "prime", "late"])` with `preferredTime: z.string().regex(/^\d{1,2}:\d{2} PM$/)` plus range validation (5:00–11:00 PM)
- Rename all `timeSlot` references → `preferredTime` in both `showReservationSummary` and `submitReservation` tools

## Voice Agent (ElevenLabs Dashboard — Manual)

Update the agent prompt/tool mapping on the ElevenLabs dashboard:

- **Old mapping:** "Seating time slot. Map the guest's requested time to: 'early' (5:30-7:00 PM), 'prime' (7:00-9:00 PM), or 'late' (9:00-11:00 PM). Must be exactly one of: early, prime, late."
- **New mapping:** "Preferred dining time. Collect the guest's specific preferred time between 5:00 PM and 11:00 PM. Format as 'H:MM PM' (e.g., '7:30 PM'). Times must be in 15-minute increments (5:00, 5:15, 5:30, 5:45, etc.). If the guest says a non-increment time, round to the nearest 15 minutes and confirm."
- Rename the field from `timeSlot` to `preferredTime` in the tool parameter definitions

## Display & Confirmation

**Files:** `components/ReservationSummaryCard.tsx`, `components/ReservationForm/steps/StepConfirmation.tsx`

- Replace `formatTimeSlot()` with direct display of the `preferredTime` value (it's already human-readable)
- Update label from "Time" row to display the stored value directly (e.g., `"7:30 PM"`)
- Rename all `timeSlot` references → `preferredTime`

## Data Coercion

**File:** `lib/coercePartialData.ts`

- Replace `TIME_SLOTS.map(s => s.id)` validation with check against `PREFERRED_TIMES` array
- Rename `timeSlot` → `preferredTime`

## Step Validation

**File:** `lib/validateReservation.ts`

- Update step 6 validation: `!!data.timeSlot` → `!!data.preferredTime`

## Files Changed (10)

1. `types/reservation.ts` — type + constants
2. `components/ReservationForm/steps/StepTime.tsx` — form UI
3. `components/ChatWidget/ChatEngine.tsx` — chat UI
4. `components/ChatWidget/VoiceAgent.tsx` — voice agent Zod schema
5. `app/api/reservations/route.ts` — API validation + INSERT
6. `components/ReservationSummaryCard.tsx` — summary display
7. `components/ReservationForm/steps/StepConfirmation.tsx` — confirmation display
8. `lib/coercePartialData.ts` — voice→type data coercion
9. `lib/validateReservation.ts` — step validation
10. CLAUDE.md files — schema documentation

## Manual Steps

1. ~~Run migration SQL in Neon dashboard~~ (already done)
2. Update ElevenLabs agent prompt and tool mapping per the "Voice Agent (ElevenLabs Dashboard)" section above
