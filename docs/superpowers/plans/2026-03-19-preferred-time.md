# Preferred Time Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-option time slot enum (early/prime/late) with a 15-minute increment time picker (5:00 PM – 11:00 PM) across all system layers.

**Architecture:** Update the shared type/constant in `types/reservation.ts`, then propagate the rename (`timeSlot` → `preferredTime`) and new validation logic outward to all consumers: form UI, chat UI, voice agent, API route, display components, and coercion/validation utilities.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Zod, ElevenLabs React SDK, Neon Postgres

**Spec:** `docs/superpowers/specs/2026-03-19-preferred-time-design.md`

---

## Task 1: Update Type System & Constants

**Files:**
- Modify: `types/reservation.ts`

- [ ] **Step 1: Replace TimeSlot type and TIME_SLOTS with PREFERRED_TIMES**

Remove `TimeSlot` type (line 1) and `TIME_SLOTS` array (lines 26-30). Add `PREFERRED_TIMES` generator and update `ReservationData` interface.

```typescript
// Remove these:
// export type TimeSlot = "early" | "prime" | "late";
// export const TIME_SLOTS = [ ... ];

// Add this:
function generatePreferredTimes(): string[] {
  const times: string[] = [];
  for (let hour = 5; hour <= 11; hour++) {
    const maxMinute = hour === 11 ? 0 : 45;
    for (let minute = 0; minute <= maxMinute; minute += 15) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const mm = minute.toString().padStart(2, "0");
      times.push(`${displayHour}:${mm} PM`);
    }
  }
  return times;
}

export const PREFERRED_TIMES = generatePreferredTimes();
```

In the `ReservationData` interface, change line 10:
```typescript
// Old: timeSlot: TimeSlot | null;
preferredTime: string | null;
```

- [ ] **Step 2: Verify the build compiles (expect errors in consumers)**

Run: `npx tsc --noEmit 2>&1 | head -50`

Expected: TypeScript errors in all consumer files referencing `timeSlot` and `TIME_SLOTS` — this confirms the type change propagated correctly. We'll fix these file-by-file in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add types/reservation.ts
git commit -m "refactor: replace TimeSlot enum with PREFERRED_TIMES array

Generates 25 time options (5:00 PM – 11:00 PM, 15-min increments).
Renames timeSlot → preferredTime in ReservationData interface."
```

---

## Task 2: Update Validation & Coercion Utilities

**Files:**
- Modify: `lib/validateReservation.ts`
- Modify: `lib/coercePartialData.ts`

- [ ] **Step 1: Update validateReservation.ts**

Change line 17:
```typescript
// Old: return !!data.timeSlot;
return !!data.preferredTime;
```

- [ ] **Step 2: Update coercePartialData.ts**

Replace the `TIME_SLOTS` import with `PREFERRED_TIMES`:
```typescript
// Old: import { ReservationData, LOCATIONS, TIME_SLOTS } from "@/types/reservation";
import { ReservationData, LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";
```

Replace the timeSlot validation block (lines 55-59) with:
```typescript
  // Validate preferredTime
  if (typeof raw.preferredTime === "string" && PREFERRED_TIMES.includes(raw.preferredTime)) {
    result.preferredTime = raw.preferredTime;
  }
```

- [ ] **Step 3: Commit**

```bash
git add lib/validateReservation.ts lib/coercePartialData.ts
git commit -m "refactor: update validation and coercion for preferredTime"
```

---

## Task 3: Update API Route

**Files:**
- Modify: `app/api/reservations/route.ts`

- [ ] **Step 1: Update the API route**

Import `PREFERRED_TIMES`:
```typescript
import { LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";
```

In the destructuring (line 9), rename `timeSlot` → `preferredTime` and update the type annotation.

In the required fields check (line 21), replace `timeSlot` → `preferredTime`.

Replace the time slot validation (line 35):
```typescript
// Old: if (!["early", "prime", "late"].includes(timeSlot)) {
if (!PREFERRED_TIMES.includes(preferredTime)) {
  return NextResponse.json({ error: "Invalid preferred time" }, { status: 400 });
}
```

Update the SQL INSERT (lines 63-68):
```sql
INSERT INTO reservation_requests
  (first_name, last_name, phone, location, date, party_size, preferred_time, special_note)
VALUES
  (${firstName}, ${lastName}, ${phone}, ${location}, ${date}, ${partySize}, ${preferredTime}, ${specialNote ?? null})
```

- [ ] **Step 2: Commit**

```bash
git add app/api/reservations/route.ts
git commit -m "fix: update API route for preferred_time column and validation"
```

---

## Task 4: Update Display Components

**Files:**
- Modify: `components/ReservationSummaryCard.tsx`
- Modify: `components/ReservationForm/steps/StepConfirmation.tsx`

- [ ] **Step 1: Update ReservationSummaryCard.tsx**

Remove `TIME_SLOTS` import (line 4) — no longer needed:
```typescript
// Old: import { ReservationData, TIME_SLOTS } from "@/types/reservation";
import { ReservationData } from "@/types/reservation";
```

Remove the `formatTimeSlot` function (lines 23-26).

Update `buildReviewRows` type signature (line 31):
```typescript
// Old: timeSlot: string | null;
preferredTime: string | null;
```

Update the Time row (line 41):
```typescript
// Old: { label: "Time", value: formatTimeSlot(data.timeSlot) },
{ label: "Time", value: data.preferredTime || "—" },
```

- [ ] **Step 2: Update StepConfirmation.tsx**

Remove the `formatTime` function (lines 23-28).

Update the Time row (line 36):
```typescript
// Old: { label: "Time", value: formatTime(data.timeSlot) },
{ label: "Time", value: data.preferredTime || "—" },
```

- [ ] **Step 3: Commit**

```bash
git add components/ReservationSummaryCard.tsx components/ReservationForm/steps/StepConfirmation.tsx
git commit -m "refactor: simplify time display using preferredTime directly"
```

---

## Task 5: Update Form UI (StepTime + FormEngine)

**Files:**
- Modify: `components/ReservationForm/steps/StepTime.tsx`
- Modify: `components/ReservationForm/FormEngine.tsx`

- [ ] **Step 1: Update StepTime.tsx**

Replace `TIME_SLOTS` import with `PREFERRED_TIMES`:
```typescript
import { ReservationData, PREFERRED_TIMES } from "@/types/reservation";
```

Replace the time slot cards (lines 50-91) with a scrollable time picker:
```tsx
{/* Time picker */}
<div
  className={shaking ? "shake" : ""}
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    maxHeight: "300px",
    overflowY: "auto",
    paddingRight: "0.25rem",
  }}
>
  {PREFERRED_TIMES.map((time) => {
    const selected = data.preferredTime === time;
    return (
      <button
        key={time}
        onClick={() => onChange({ preferredTime: time })}
        className={`time-card ${selected ? "time-card--selected" : ""}`}
        style={{ width: "100%", background: "none", cursor: "pointer" }}
      >
        <span
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "1.2rem",
            fontWeight: 400,
            color: "var(--cream)",
          }}
        >
          {time}
        </span>
        {selected && (
          <span style={{ color: "var(--cream)", fontSize: "1rem" }}>✓</span>
        )}
      </button>
    );
  })}
</div>
```

- [ ] **Step 2: Update FormEngine.tsx**

Change `INITIAL_DATA` (line 22):
```typescript
// Old: timeSlot: null,
preferredTime: null,
```

Change `validate` case 6 (line 51):
```typescript
// Old: case 6: return !!data.timeSlot;
case 6: return !!data.preferredTime;
```

- [ ] **Step 3: Verify build compiles for form flow**

Run: `npx tsc --noEmit 2>&1 | grep -E "(StepTime|FormEngine|StepConfirmation)" | head -10`

Expected: No errors for these files.

- [ ] **Step 4: Commit**

```bash
git add components/ReservationForm/steps/StepTime.tsx components/ReservationForm/FormEngine.tsx
git commit -m "feat: replace time slot cards with scrollable time picker in form"
```

---

## Task 6: Update Chat UI (ChatEngine)

**Files:**
- Modify: `components/ChatWidget/ChatEngine.tsx`

- [ ] **Step 1: Update imports**

```typescript
// Old: import { ReservationData, LOCATIONS, TIME_SLOTS } from "@/types/reservation";
import { ReservationData, LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";
```

- [ ] **Step 2: Update INITIAL_DATA (line 30)**

```typescript
// Old: timeSlot: null,
preferredTime: null,
```

- [ ] **Step 3: Update getUserText case 6 (lines 116-119)**

```typescript
case 6:
  return data.preferredTime ?? "";
```

- [ ] **Step 4: Update renderInputZone case 6 (lines 478-516)**

Replace the `TIME_SLOTS.map` block with a scrollable `PREFERRED_TIMES` picker:

```tsx
case 6:
  return (
    <div>
      <div
        className={shaking ? "shake" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: "200px",
          overflowY: "auto",
          paddingRight: "0.25rem",
        }}
      >
        {PREFERRED_TIMES.map((time) => {
          const selected = data.preferredTime === time;
          return (
            <button
              key={time}
              onClick={() => update({ preferredTime: time })}
              className={`time-card ${selected ? "time-card--selected" : ""}`}
              style={{ width: "100%", background: "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1rem", color: "var(--cream)" }}>
                {time}
              </span>
              {selected && <span style={{ color: "var(--cream)", fontSize: "0.9rem" }}>✓</span>}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <label style={labelStyle}>Special Requests (optional)</label>
        <textarea
          className="form-input"
          placeholder="Anniversaries, dietary restrictions, seating preferences…"
          value={data.specialNote}
          onChange={(e) => update({ specialNote: e.target.value })}
          rows={2}
          style={{ resize: "none", fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1rem" }}
        />
      </div>
    </div>
  );
```

- [ ] **Step 5: Commit**

```bash
git add components/ChatWidget/ChatEngine.tsx
git commit -m "feat: replace time slot cards with scrollable time picker in chat"
```

---

## Task 7: Update Voice Agent

**Files:**
- Modify: `components/ChatWidget/VoiceAgent.tsx`

- [ ] **Step 1: Import PREFERRED_TIMES**

```typescript
// Old: import { ReservationData, LOCATIONS } from "@/types/reservation";
import { ReservationData, LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";
```

- [ ] **Step 2: Update Zod schema (line 45)**

```typescript
// Old: timeSlot: z.enum(["early", "prime", "late"]),
preferredTime: z.string().refine(
  (val) => PREFERRED_TIMES.includes(val),
  { message: "Must be a valid time between 5:00 PM and 11:00 PM in 15-minute increments" }
),
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No TypeScript errors (all files now updated).

- [ ] **Step 4: Commit**

```bash
git add components/ChatWidget/VoiceAgent.tsx
git commit -m "feat: update voice agent Zod schema for preferredTime"
```

---

## Task 8: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/CLAUDE.md`

- [ ] **Step 1: Update schema docs in both files**

In both CLAUDE.md files, replace:
```
time_slot    TEXT NOT NULL   -- 'early' | 'prime' | 'late'
```

With:
```
preferred_time TEXT NOT NULL -- e.g. '7:30 PM', 15-min increments 5:00-11:00 PM
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md .claude/CLAUDE.md
git commit -m "docs: update schema docs for preferred_time column"
```

---

## Task 9: Full Build Verification & Manual Test

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: Clean — no errors.

- [ ] **Step 2: Run dev server and smoke test**

Run: `npm run dev`

Test manually:
1. Open http://localhost:3000
2. Go through the form flow — step 6 should show scrollable time picker with 25 options
3. Select a time (e.g., "7:30 PM"), review on confirmation, submit
4. Open the chat widget (Type mode) — step 6 should show same picker
5. Check Neon dashboard: `SELECT * FROM reservation_requests ORDER BY created_at DESC LIMIT 1;` — `preferred_time` should show `"7:30 PM"`

- [ ] **Step 3: Commit any remaining fixes if needed**

---

## Task 10: Provide ElevenLabs Dashboard Instructions

- [ ] **Step 1: Output the ElevenLabs update instructions for the user**

Provide the user with the exact text to update in the ElevenLabs dashboard:

1. **Tool parameter rename:** In both `showReservationSummary` and `submitReservation` tool definitions, rename the `timeSlot` parameter to `preferredTime`
2. **Parameter description update:** Change the `preferredTime` parameter description to: "Preferred dining time. Collect the guest's specific preferred time between 5:00 PM and 11:00 PM. Format as 'H:MM PM' (e.g., '7:30 PM'). Times must be in 15-minute increments (5:00, 5:15, 5:30, 5:45, etc.). If the guest says a non-increment time, round to the nearest 15 minutes and confirm. If the guest requests a time outside 5:00–11:00 PM, politely explain that dinner service runs from 5:00 to 11:00 PM. If the guest says just an hour like '7' without AM/PM, assume PM."
3. **Agent prompt update:** Remove any references to "early/prime/late" mapping in the system prompt
