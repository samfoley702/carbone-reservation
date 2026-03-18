---
title: "feat: Replace full-screen TypeForm overlay with chat-style customer service popup"
type: feat
date: 2026-03-18
issue: 5
---

# feat: Replace Full-Screen TypeForm Overlay with Chat-Style Concierge Popup

## Enhancement Summary

**Deepened on:** 2026-03-18
**Research agents used:** TypeScript reviewer, race-conditions reviewer, architecture strategist, security sentinel, performance oracle, simplicity reviewer, brand design expert, agent-native reviewer

### Key Improvements From Research

1. **Extract `useReservationFlow` hook** before writing ChatEngine — makes Issue #6 (voice agent) trivial to add; without this, voice agent requires refactoring shipped code
2. **Use `useReducer` + `useActionState`** — removes 6 separate `useState` calls; step completion is atomic, submit state is managed by React 19 natively
3. **Collapse to 2 files** (not 4) — ChatBubble inlined in ChatEngine, ChatInput dropped in favor of direct step component reuse; 35–40% less code
4. **Fix all race conditions** inherited from FormEngine: mounted ref for 400ms timer, AbortController for fetch, RAF for focus management, debounced scroll
5. **Luxury brand design** — angular 4px bubbles, text-only "CONCIERGE" FAB, Cormorant/Oswald header split, gold hairline left border on bot bubbles instead of avatar, tonal input zone separation
6. **Performance fixes** — `transition-[opacity,transform]` not `transition-all`, `dynamic()` import, `React.memo` on message bubbles, `instant` scroll
7. **Security** — rate limiting + server-side field length validation before launch

### New Considerations Discovered

- `messages[].key` naming collision with React's reserved `key` prop — rename to `id`
- `step` should be typed as literal union `1|2|3|4|5|6|7`, not `number`
- FAB should not appear on page load — animate in after hero scroll
- Panel open: scale-from-bottom-right animation, not slide-up
- Mobile: bottom sheet with drag handle + `env(safe-area-inset-bottom)` padding

---

## Overview

Replace the current full-screen `form-overlay` takeover with a compact, persistent chat-style popup anchored to the bottom-right corner — styled like a live support widget but fully on-brand for Carbone. All 7 reservation questions flow as an accumulating conversational thread. The site remains fully visible and scrollable behind the popup at all times.

---

## Problem Statement / Motivation

The current TypeForm-style full-screen overlay is disruptive: it hides the entire site, locks body scroll, and requires the guest to fully commit to the flow before seeing any content. A compact chat popup is:

- **Less invasive** — the site stays visible; guests can still browse while filling out
- **More familiar** — guests recognize the pattern from live support tools
- **More appropriate for mobile** — a bottom-anchored sheet feels native on phone
- **Incrementally committable** — guests can close and return without losing context

---

## Proposed Solution

### Architecture Decision: Scrollable Chat History Model

The popup presents all Q&A pairs as an **accumulating chat thread** (iMessage model). Each completed step leaves a persisted bot question bubble + user answer bubble. The guest can scroll up to review prior answers. The active input zone is always at the bottom.

This model was chosen over the one-at-a-time model because:
- It shows the guest their progress at a glance
- It feels more natural for a "concierge" interaction
- It is explicitly specified in Issue #5 ("conversational chat bubble format")

### State on Close

**Reset on close** — `ChatEngine` is conditionally rendered (`{isOpen && <ChatEngine />}`), unmounting on close and clearing all state. Simpler than explicit reset, matches current `FormEngine` behavior.

### Scroll Lock

**No body scroll lock** — the site remains scrollable at all times per spec. `overscroll-behavior: contain` (Tailwind's `overscroll-contain`) on the internal message thread prevents scroll chaining on iOS.

### Future-Proofing for Issue #6 (Voice Agent Tab)

The critical architectural decision: **extract step orchestration into a `useReservationFlow` custom hook before shipping Issue #5**. This hook returns `{ step, data, update, advance, back, isValid, submit, submitting, submitted }`. When Issue #6 adds a voice agent tab, `VoiceEngine.tsx` calls the same hook. Without this, Issue #6 requires refactoring shipped code.

---

## Technical Approach

### Simplified Component Tree

After simplicity and architecture review, **4 files reduces to 2**:

```
components/ChatWidget/
  index.tsx       — FAB + popup shell (isOpen state, animation, scroll-in reveal)
  ChatEngine.tsx  — step orchestrator + inline bubble rendering + step input zone

hooks/
  useReservationFlow.ts  — NEW: pure step logic hook (shared with future VoiceEngine)

lib/
  validateReservation.ts — NEW: pure validateStep(step, data) function (extracted from FormEngine)
```

`ChatBubble` becomes an inline function component inside `ChatEngine` (15 lines, not worth a file).
`ChatInput` is dropped — step components are rendered directly, following the existing `stepComponents` array pattern in `FormEngine.tsx`.

### New Type Definitions

```ts
// types/chat.ts — NEW

export type ChatStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  id: string;   // NOT 'key' — React reserves 'key' as a prop name; naming it 'key'
                //  causes silent drops when spreading ChatMessage onto components
}
```

**Critical:** `step` typed as `ChatStep` (literal union), not `number`. Makes the validate switch exhaustive-checkable. Prevents `setStep(0)` or `setStep(99)`.

### `useReservationFlow` Hook

```ts
// hooks/useReservationFlow.ts — NEW

export function useReservationFlow() {
  // useReducer with ChatAction union (see below)
  // returns: { step, data, messages, dispatch, submit, submitting, submitted, error }
}

type ChatAction =
  | { type: 'STEP_COMPLETE'; userMessage: ChatMessage; botMessage: ChatMessage; nextStep: ChatStep }
  | { type: 'UPDATE_DATA'; updates: Partial<ReservationData> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'SHAKE' }
  | { type: 'SHAKE_RESET' };
```

`STEP_COMPLETE` atomically appends both bubbles and advances step in a single dispatch — no two-setState inconsistency. Both `ChatEngine` (typed input) and future `VoiceEngine` (audio) call the same hook.

### `validateReservation.ts` — Extract, Don't Copy

**Do not copy `validate()` from `FormEngine.tsx`.** Extract it as a pure function:

```ts
// lib/validateReservation.ts — NEW
export function validateStep(step: ChatStep, data: ReservationData): boolean {
  switch (step) {
    case 1: return !!(data.firstName.trim() && data.lastName.trim());
    case 2: return /^[\+]?[\d\s\-\(\)]{10,}$/.test(data.phone.replace(/\s/g, ''));
    case 3: return !!data.location;
    case 4: return !!data.date;
    case 5: return data.partySize >= 1 && data.partySize <= 20;
    case 6: return !!data.timeSlot;
    case 7: return true;
  }
}
```

**Import this in both `FormEngine.tsx` (replace its inline validate) and `ChatEngine.tsx`.**

### Step Config Array (Not Parallel Switch Blocks)

Define a single configuration object to keep step orchestration in one place:

```ts
// inside useReservationFlow.ts or ChatEngine.tsx
const STEP_CONFIG: Record<ChatStep, { question: string }> = {
  1: { question: "Welcome to Carbone. What is your name?" },
  2: { question: "And your phone number?" },
  3: { question: "Which Carbone location?" },
  4: { question: "What date were you thinking?" },
  5: { question: "How many guests?" },
  6: { question: "What time works best?" },
  7: { question: "Here's your request — shall we send it?" },
};
```

Adding/reordering a step = one edit in one place.

### State Management: `useReducer` + `useActionState`

Replace the planned 6 `useState` calls with `useReducer` for all chat state and React 19's `useActionState` for the submit action:

```ts
// useActionState for submit — React 19 native
const [submitState, submitAction, isPending] = useActionState(
  async (_prev: SubmitState) => {
    const controller = abortControllerRef.current;
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        signal: controller?.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { status: 'error', message: 'Something went wrong.' } as const;
      return { status: 'success' } as const;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return { status: 'idle' } as const;
      return { status: 'error', message: 'Unable to reach our servers.' } as const;
    }
  },
  { status: 'idle' } as const
);
```

`isPending` replaces the `submitting` boolean. `submitState.status` replaces `submitted`/`error` booleans. Two fewer `useState` calls.

### `ChatWidget/index.tsx`

- `useState<boolean>(false)` for `isOpen`
- FAB: `position: fixed`, `bottom-6`, `right-4 sm:right-6`, **does not appear on page load** — fades in after user scrolls past hero (IntersectionObserver on hero element, or scroll > 100vh)
- Popup: `position: fixed`, `bottom-24`, `inset-x-2 sm:inset-x-auto sm:right-6 sm:w-96`
- `max-h-[80dvh]` (dynamic viewport units — survives iOS Safari toolbar show/hide)
- **Open animation:** `transform-origin: bottom right`, `scale(0.95) → scale(1)` + `opacity 0→1`, `300ms cubic-bezier(0.16, 1, 0.3, 1)` — scale-from-corner, not slide-up
- **Close animation:** reverse of open
- `transition-[opacity,transform]` NOT `transition-all` — `transition-all` forces layout recalculation on every animation frame
- On open: `requestAnimationFrame(() => requestAnimationFrame(() => firstInputRef.current?.focus()))` — two-RAF pattern (matches existing FormEngine double-RAF at lines 88–93), not a 50ms setTimeout which is arbitrary and breaks on slow devices
- On close: focus returns to FAB via `fabRef.current?.focus()`
- `dynamic()` import the ChatWidget in page.tsx: `const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false })` — removes widget from initial bundle

### `ChatWidget/ChatEngine.tsx`

Built around `useReservationFlow()` hook. Renders:

1. **Message thread** (`role="log"`, `aria-live="polite"`, `overscroll-contain`)
   - Inline `ChatBubble` function component — bot: left-aligned, angular (4px radius), left gold hairline border; user: right-aligned, angular, warm gold wash background
   - `React.memo` on the ChatBubble component — messages never mutate after append, memo eliminates N re-renders per new message
   - `bubbleIn` keyframe: `opacity 0→1` + `translateY(8px)→0` + `scale(0.97)→1`, 400ms `cubic-bezier(0.16, 1, 0.3, 1)`
   - Auto-scroll: `behavior: 'instant'` (not `'smooth'`) — eliminates scroll/animation conflict; the bubble animation itself provides sufficient motion

2. **Active step input zone** — renders existing step components directly via `stepComponents[step - 1]` array, following the `FormEngine.tsx` pattern exactly

**Race condition fixes (all inherited from FormEngine):**

```ts
// Mounted ref — required for 400ms location timer and triggerShake
const mountedRef = useRef(true);
useEffect(() => () => { mountedRef.current = false; }, []);

// Auto-advance location: already has clearTimeout cleanup in FormEngine —
// verify cleanup function is included; add mountedRef guard in callback

// Shake timer: add mountedRef guard
const triggerShake = () => {
  dispatch({ type: 'SHAKE' });
  setTimeout(() => {
    if (mountedRef.current) dispatch({ type: 'SHAKE_RESET' });
  }, 500);
};

// AbortController for fetch — mounted cleanup
const abortControllerRef = useRef<AbortController | null>(null);
useEffect(() => () => { abortControllerRef.current?.abort(); }, []);
```

**Keyboard:** `Enter` advances step (scoped to ChatEngine container div `onKeyDown`, not `window` — prevents conflict with background site interaction). `Escape` calls `onClose`.

### `app/page.tsx` Changes

```tsx
// Remove:
const [formOpen, setFormOpen] = useState(false);
// and all onReserveClick prop passing to Nav, Hero, Locations, ReserveCTA

// Add (dynamic import, no SSR):
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

// Replace <ReservationForm ... /> with:
<ChatWidget />
```

### `app/globals.css` Additions

```css
@keyframes slideUpPopup {
  from { opacity: 0; transform: scale(0.95); transform-origin: bottom right; }
  to   { opacity: 1; transform: scale(1); transform-origin: bottom right; }
}

@keyframes bubbleIn {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Only 2 BEM variant classes — consistent with existing pattern */
/* (.cal-day--selected, .time-card--selected, .form-step--active) */
.chat-bubble--bot {
  align-self: flex-start;
  background: var(--bg-elevated);
  border-radius: 4px;
  border-left: 1px solid rgba(201, 168, 76, 0.5); /* gold hairline — the "house voice" */
}

.chat-bubble--user {
  align-self: flex-end;
  background: rgba(201, 168, 76, 0.08); /* warm gold wash — readable at all times */
  border-radius: 4px;
}
```

The `.chat-popup` and `.chat-input-zone` "classes" from the original plan are dropped — these are layout-only and fit the existing inline-style pattern.

---

## Visual Design (Luxury Brand Treatment)

### FAB

```
Text-only: "CONCIERGE"
Font: var(--font-oswald), uppercase, letter-spacing: 0.18em
Size: 0.75rem
Background: var(--gold), color: #0A1A29
Border-radius: 2px  ← matches all existing buttons exactly
Padding: 12px 24px
Visibility: hidden on page load → fades in after hero scrolls out of view
```

On mobile (<640px): collapses to 48×48px square gold button with a single thin horizontal line (2px stroke, 20px wide) centered — not a hamburger, not an icon, just a mark.

### Popup Header

```
Top edge: 1px gold line (full width, contained within horizontal padding)
↓
"CARBONE" — Oswald, 0.65rem, letter-spacing: 0.3em, color: var(--cream-muted)  [eyebrow]
↓
"Concierge" — Cormorant Italic, 1.4rem, color: var(--cream)                    [title]
↓
Thin gold rule: border-top: 1px solid var(--gold); opacity: 0.4; margin: 10px 24px 0;

Close affordance: "ESC" in Oswald 0.6rem, letter-spacing: 0.2em, cream-muted — not ×
```

### Chat Bubbles

**No bot avatar.** The gold hairline left border (`border-left: 1px solid rgba(201, 168, 76, 0.5)`) on bot bubbles signals "the house is speaking" without importing consumer-tech chat-app conventions. A Carbone concierge does not need a profile photo.

**No rounded speech tails.** 4px `border-radius` on all corners. The rounded-blob bubble aesthetic conflicts with the brand's existing `border-radius: 2px` on buttons. Angular bubbles read as intentional restraint.

**Message thread background:** `var(--bg-elevated)` (#0f2035) so the thread area has a tonal lift from the popup's `var(--bg)` base. The input zone at the bottom reverts to `var(--bg)` — tonal separation instead of a hard border line.

### Input Zone

```
Padding: 20px 24px 24px
Background: var(--bg)  ← tonal separation from elevated message thread
No horizontal border/rule

Input text: Cormorant, 1.5rem, gold caret — identical to existing .form-input
Send trigger: right-aligned text "SEND →" in Oswald, 0.7rem, letter-spacing: 0.15em, var(--gold)
              (the → is a literal Unicode arrow character, not an icon)
```

### Mobile Bottom Sheet

On screens < 640px the popup becomes a bottom sheet:
- `max-height: 85dvh` (dvh = dynamic viewport height, survives iOS toolbar)
- `border-radius: 12px 12px 0 0` (rounded top edge only)
- Drag handle: 32×2px pill, `var(--border)` color, centered at top
- `padding-bottom: env(safe-area-inset-bottom)` on input zone — mandatory for iPhone home indicator
- Backdrop: `backdrop-filter: blur(4px)` + very low-opacity dark overlay — reinforces sheet layering
- FAB collapses to square mark (see above)
- Header: `CARBONE` eyebrow only, omit "Concierge" subtitle to preserve vertical space

### Typing Indicator (while bot "thinking")

Replace three-dot bouncing animation with a single 2px × 24px gold line that pulses `opacity: 0.3 → 0.8` at `1.8s ease-in-out infinite`. Reads as a breath, not a loading spinner.

---

## Performance Requirements

| Concern | Requirement |
|---|---|
| Initial bundle | `dynamic(() => import(...), { ssr: false })` — widget excluded from page load |
| Popup open/close | `transition-[opacity,transform]` NOT `transition-all` |
| bubbleIn keyframe | Only `opacity` + `transform` — no layout properties |
| Message re-renders | `React.memo` on bubble component — renders once on append, never again |
| Auto-scroll | `behavior: 'instant'` — eliminates scroll/animation conflict |
| ChatInput handlers | `useCallback` on advance/change handlers — prevents unnecessary re-renders |
| `prefers-reduced-motion` | All animations wrapped: `@media (prefers-reduced-motion: reduce) { animation: none }` |

---

## Security Requirements

These should be addressed in this PR (rate limiting) or immediately after (headers):

### 1. Rate Limiting — Before Launch

Add to `/api/reservations/route.ts` using Upstash Redis + `@upstash/ratelimit`:

```ts
// ~20 lines, standard Next.js App Router pattern
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 submissions per IP per hour
});

// In handler:
const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
const { success } = await ratelimit.limit(ip);
if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
```

### 2. Server-Side Field Validation — Before Launch

Add to `/api/reservations/route.ts` (after required-field check):

```ts
// Length limits
if (firstName.length > 100 || lastName.length > 100) return badRequest("Name too long");
if (phone.length > 30) return badRequest("Phone too long");
if (specialNote && specialNote.length > 1000) return badRequest("Note too long");

// Enum validation — currently any string is accepted and stored
const VALID_TIME_SLOTS = ['early', 'prime', 'late'] as const;
if (!VALID_TIME_SLOTS.includes(time_slot)) return badRequest("Invalid time slot");
```

### 3. Security Headers — Next PR

Add to `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Resolved Edge Cases (from SpecFlow Analysis)

| Edge Case | Resolution |
|---|---|
| State on close mid-flow | Reset (conditional render, unmounts on close) |
| Submission error UI | In-chat error bot bubble replaces `alert()` — renders error text from `submitState` |
| 400ms location auto-advance | Preserve — keep in component layer (not in hook); add `mountedRef` guard |
| Scroll bleed-through (iOS) | `overscroll-contain` on message thread container |
| Mobile keyboard obscuring input | Natural browser behavior; popup internal scroll makes inputs accessible |
| Keyboard `Enter`/`Escape` scope | Scoped to ChatEngine container `onKeyDown`, not `window` |
| Arrow key conflict (party size vs. chat scroll) | Arrow keys scoped to stepper input element, not chat scroll area |
| `Carbone ${data.location}` display bug | **Fix in this PR** — map location id to display name from `LOCATIONS` constant in confirmation bubble |
| Post-success reopen | Shows fresh form (reset on close) |
| Double-tap submit | `isPending` from `useActionState` prevents re-submission |
| FAB overlapping browser UI on mobile | `bottom-6` + `env(safe-area-inset-bottom)` via CSS `padding-bottom` |
| Outside click closes popup | No — popup is non-modal; background remains interactive |
| Fetch abort on unmount | `AbortController` in `useEffect` cleanup |
| Focus trap | None — `aria-modal="false"` (no backdrop, page remains interactive) |
| `Escape` while typing in textarea | Closes popup — acceptable; same as current FormEngine behavior |

---

## Files to Create / Modify

**Create:**
- `types/chat.ts` — `ChatStep`, `ChatMessage` types
- `lib/validateReservation.ts` — `validateStep()` pure function
- `hooks/useReservationFlow.ts` — shared step orchestration hook
- `components/ChatWidget/index.tsx` — FAB + popup shell
- `components/ChatWidget/ChatEngine.tsx` — message thread + inline bubble + step rendering

**Modify:**
- `app/globals.css` — add `slideUpPopup`, `bubbleIn` keyframes + 2 BEM classes
- `app/page.tsx` — `dynamic()` import ChatWidget, remove `formOpen` state + `onReserveClick` props
- `components/Nav.tsx` — remove `onReserveClick` prop
- `components/Hero.tsx` — remove `onReserveClick` prop
- `components/Locations.tsx` — remove `onReserveClick` prop
- `components/ReserveCTA.tsx` — remove `onReserveClick` prop
- `app/api/reservations/route.ts` — add rate limiting + field length + enum validation
- `components/ReservationForm/FormEngine.tsx` — replace inline `validate()` with import from `lib/validateReservation.ts`

**No changes needed:**
- `lib/db.ts`
- `app/api/reservations/route.ts` schema (POST payload contract unchanged)
- `components/ReservationForm/` — leave in place; delete in follow-up PR after QA

---

## Acceptance Criteria

- [ ] Floating "CONCIERGE" button visible on all page sections (fixed, bottom-right) — appears after hero scrolls out of view
- [ ] FAB has hover/focus state, keyboard accessible
- [ ] Clicking opens compact chat popup with scale-from-corner animation (not full-screen)
- [ ] Popup header: "CARBONE" eyebrow / "Concierge" title / gold rules (not "Carbone Concierge" single string)
- [ ] All 7 reservation questions flow as chat message bubbles in sequence
- [ ] Completed Q&A pairs remain visible in scrollable thread (chat history model)
- [ ] Bot bubbles: left-aligned, 4px radius, gold left hairline border (no avatar)
- [ ] User bubbles: right-aligned, 4px radius, warm gold wash background
- [ ] Chat bubbles animate in with `bubbleIn` keyframe on append
- [ ] Active step input zone at bottom renders appropriate UI per step
- [ ] Step validation works (shake feedback on invalid input)
- [ ] Form submission POSTs to `/api/reservations` and saves to Neon
- [ ] Success renders as in-chat bot bubble
- [ ] Submission errors render as in-chat bot bubble with retry (no `alert()`)
- [ ] Rate limiting returns 429 after 5 submissions/IP/hour
- [ ] Server-side validates field lengths and `timeSlot` enum
- [ ] Closing popup resets state (fresh form on next open)
- [ ] Open/close animation: scale from bottom-right corner, 300ms
- [ ] Site content fully visible and **scrollable** behind popup (no body scroll lock)
- [ ] `overscroll-contain` prevents scroll bleed-through on iOS
- [ ] Full-width bottom sheet on screens < 640px with drag handle + safe-area insets
- [ ] Location display name shown correctly in confirmation bubble (not raw id)
- [ ] `Escape` closes popup; `Enter` advances step (scoped to widget)
- [ ] Widget excluded from initial page bundle (dynamic import)
- [ ] `React.memo` on bubble component — no re-renders of existing messages
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] No `transition-all` — only `transition-[opacity,transform]`
- [ ] No TypeScript errors; no console errors

---

## Dependencies & Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Calendar component too wide for 380px popup | Low | `maxWidth: 320px` fits in 380px popup with 30px padding; confirmed |
| 9-location button grid in narrow container | Medium | Use 2-column grid inside popup (vs. current wider layout); test immediately |
| iOS keyboard obscuring active input | Low-Medium | Popup internal scroll handles it; test on physical device |
| Scroll bleed-through on iOS | Low | `overscroll-contain` is the correct fix; test on Safari |
| Animation jank on low-end devices | Low | CSS-only; `prefers-reduced-motion` respected |
| Upstash Redis adds env var dependency | Low | Env var `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `.env.local` + Vercel |
| `useReservationFlow` scope creep | Low | Keep the hook pure logic only; no rendering, no DOM access |

---

## References

### Internal
- [components/ReservationForm/FormEngine.tsx](components/ReservationForm/FormEngine.tsx) — step state, validate, submit patterns (extract, don't copy)
- [components/ReservationForm/steps/StepConfirmation.tsx](components/ReservationForm/steps/StepConfirmation.tsx#L97) — stagger animation delay formula
- [app/globals.css](app/globals.css#L3-L15) — CSS variables for brand colors
- [types/reservation.ts](types/reservation.ts) — `ReservationData`, `LOCATIONS`, `TIME_SLOTS` (all reusable unchanged)
- [app/api/reservations/route.ts](app/api/reservations/route.ts) — unchanged POST contract

### External
- [Upstash Ratelimit for Next.js App Router](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [React 19 `useActionState`](https://react.dev/reference/react/useActionState)
- [Tailwind `transition-[opacity,transform]` syntax](https://tailwindcss.com/docs/transition-property)
- [CSS `overscroll-behavior: contain`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior)
- [dvh units for iOS Safari](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths)

### Related Issues
- [GitHub Issue #5](https://github.com/samfoley702/carbone-reservation/issues/5) — this feature
- [GitHub Issue #6](https://github.com/samfoley702/carbone-reservation/issues/6) — voice agent tab (uses same `useReservationFlow` hook)
