# Design: Replace Time Slot Enum with Specific Preferred Time

**Issue:** #26 — fix Time Slot mapping
**Date:** 2026-03-19

## Summary

Replace the three-tier time slot system (`early`, `prime`, `late`) with a 15-minute increment time picker allowing guests to request any specific time between 5:00 PM and 11:00 PM. This change spans the database, type system, form UI, chat UI, voice agent, API validation, and display components.

## Database

- Column renamed: `time_slot` → `preferred_time` (already executed)
- Existing rows deleted (demo data only)
- Column type: `TEXT NOT NULL` (unchanged)
- Stored values: `"5:00 PM"`, `"5:15 PM"`, … `"11:00 PM"` (12-hour format, no leading zero on hour)
- Canonical format: `"H:MM PM"` — e.g., `"5:00 PM"`, `"7:30 PM"`, `"11:00 PM"`

## Type System & Constants

**File:** `types/reservation.ts`

- Remove `TimeSlot` type (`"early" | "prime" | "late"`)
- Remove `TIME_SLOTS` array of `{ id, label, hours }` objects
- Add `PREFERRED_TIMES` — generated array of 25 time strings from `"5:00 PM"` to `"11:00 PM"` in 15-minute increments, using no leading zero format
- Generation logic: loop from 5:00 PM to 11:00 PM, incrementing by 15 minutes, formatting as `h:mm PM`
- Rename `timeSlot: TimeSlot | null` → `preferredTime: string | null` in `ReservationData` interface

## UI — Time Picker

**Files:** `components/ReservationForm/steps/StepTime.tsx`, `components/ChatWidget/ChatEngine.tsx`

- Replace 3 button cards with scrollable list of 25 time options
- Scroll container: ~300px max-height, compact buttons (single line per time, smaller padding than current cards)
- Each option is a button displaying the time (e.g., `"7:30 PM"`)
- Maintain existing Carbone aesthetic (gold/cream colors, checkmark on selection)
- Clicking a time calls `onChange({ preferredTime: "7:30 PM" })`
- If returning to step 6 with a previously selected time, auto-scroll to the selected option
- Special requests textarea remains on the same step
- ChatEngine `getUserText` for step 6: return `data.preferredTime ?? ""` directly (already human-readable)

## Form Engine

**File:** `components/ReservationForm/FormEngine.tsx`

- Update `INITIAL_DATA`: `timeSlot: null` → `preferredTime: null`
- Update `validate()`: `!!data.timeSlot` → `!!data.preferredTime`
- Payload sent to API will automatically pick up the renamed field from `ReservationData`

## API Validation

**File:** `app/api/reservations/route.ts`

- Rename `timeSlot` → `preferredTime` in request body destructuring
- Validate `preferredTime` by checking membership in the `PREFERRED_TIMES` array (single source of truth)
- Update SQL INSERT: column `time_slot` → `preferred_time`, value `timeSlot` → `preferredTime`

## Voice Agent (Code)

**File:** `components/ChatWidget/VoiceAgent.tsx`

- Update Zod schema: replace `timeSlot: z.enum(["early", "prime", "late"])` with `preferredTime: z.string().refine(val => PREFERRED_TIMES.includes(val))` — validates against the same constant array used everywhere else
- Rename all `timeSlot` references → `preferredTime` in both `showReservationSummary` and `submitReservation` tools

## Voice Agent (ElevenLabs Dashboard — Manual)

Update the agent prompt/tool mapping on the ElevenLabs dashboard:

- **Old mapping:** "Seating time slot. Map the guest's requested time to: 'early' (5:30-7:00 PM), 'prime' (7:00-9:00 PM), or 'late' (9:00-11:00 PM). Must be exactly one of: early, prime, late."
- **New mapping:** "Preferred dining time. Collect the guest's specific preferred time between 5:00 PM and 11:00 PM. Format as 'H:MM PM' (e.g., '7:30 PM'). Times must be in 15-minute increments (5:00, 5:15, 5:30, 5:45, etc.). If the guest says a non-increment time, round to the nearest 15 minutes and confirm. If the guest requests a time outside 5:00–11:00 PM, politely explain that dinner service runs from 5:00 to 11:00 PM. If the guest says just an hour like '7' without AM/PM, assume PM."
- Rename the field from `timeSlot` to `preferredTime` in the tool parameter definitions

## Display & Confirmation

**Files:** `components/ReservationSummaryCard.tsx`, `components/ReservationForm/steps/StepConfirmation.tsx`

- Remove `formatTimeSlot()` / `formatTime()` functions — the stored value is already human-readable
- Display `preferredTime` directly in the "Time" row (e.g., `"7:30 PM"`)
- Update `buildReviewRows` type signature: `timeSlot: string | null` → `preferredTime: string | null`
- Rename all `timeSlot` references → `preferredTime`

## Data Coercion

**File:** `lib/coercePartialData.ts`

- Replace `TIME_SLOTS.map(s => s.id)` validation with check against `PREFERRED_TIMES` array
- Rename `timeSlot` → `preferredTime`

## Step Validation

**File:** `lib/validateReservation.ts`

- Update step 6 validation: `!!data.timeSlot` → `!!data.preferredTime`

## Files Changed (11)

1. `types/reservation.ts` — type + constants
2. `components/ReservationForm/steps/StepTime.tsx` — form UI
3. `components/ReservationForm/FormEngine.tsx` — initial data + validation
4. `components/ChatWidget/ChatEngine.tsx` — chat UI + getUserText
5. `components/ChatWidget/VoiceAgent.tsx` — voice agent Zod schema
6. `app/api/reservations/route.ts` — API validation + INSERT
7. `components/ReservationSummaryCard.tsx` — summary display + type signature
8. `components/ReservationForm/steps/StepConfirmation.tsx` — confirmation display
9. `lib/coercePartialData.ts` — voice→type data coercion
10. `lib/validateReservation.ts` — step validation
11. CLAUDE.md files — schema documentation

## Manual Steps

1. ~~Run migration SQL in Neon dashboard~~ (done)
2. ~~Delete existing demo rows~~ (done)
3. Update ElevenLabs agent prompt and tool mapping per the "Voice Agent (ElevenLabs Dashboard)" section above
