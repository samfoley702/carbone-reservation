---
title: "feat: Talk or Type — voice agent option in reservation chat"
type: feat
date: 2026-03-18
issue: 6
---

# feat: Talk or Type — Voice Agent Option in Reservation Chat

## Enhancement Summary

**Deepened on:** 2026-03-18
**Sections enhanced:** 8
**Research agents used:** best-practices-researcher, security-sentinel, architecture-strategist, julik-frontend-races-reviewer, kieran-typescript-reviewer, performance-oracle, agent-native-reviewer, framework-docs-researcher

### Key Improvements
1. **SDK API updated**: `onMessage` uses `role: "user" | "agent"` (not deprecated `source`); `onDisconnect` receives typed `DisconnectionDetails`; signed URLs valid 15 min (not 60s)
2. **6 race conditions identified and fixed**: double-endSession, stale closure in onMessage, concurrent session double-tap, mic+URL serialization, retry leaving mic open, setState after unmount
3. **Security hardened**: Rate limiting on `/api/voice-session`, Origin header CSRF check, Zod validation of agent tool params, security headers in `next.config.ts`
4. **Agent-native parity gaps fixed**: timeSlot descriptions with hour ranges, success message surfaced to agent, location descriptors in system prompt, phone format documented
5. **Performance optimized**: pre-fetch signed URL on widget open, `isSpeaking` isolated component, CSS-only pulse animation, functional setState in onMessage

### New Considerations Discovered
- `endSession()` must NEVER be called from inside `onDisconnect` — causes WebSocket CLOSING error
- Mic must be acquired **before** fetching signed URL (serialize, don't parallelize) on iOS Safari
- `VoiceAgent` must be wrapped with `dynamic(..., { ssr: false })` in the parent, not as a self-wrap
- `coercePartialData` utility required to convert ElevenLabs string date → `Date` for ChatEngine
- Step-jump policy decision needed: always start at step 1 (recommended for simplicity)

---

## Overview

Add a mode-selection screen to the chat popup so guests can choose between typing their reservation or speaking it. The **Type** flow is unchanged. The **Talk** flow launches an ElevenLabs Conversational AI voice agent that guides the guest through all reservation fields verbally, displays transcription as chat bubbles, spells back the name and phone number for confirmation, then submits to `/api/reservations`.

**Depends on:** Issue #5 (chat popup) — complete ✅

---

## Proposed Solution

### Provider: ElevenLabs Conversational AI

ElevenLabs beats OpenAI Realtime API for this use case:

| Factor | ElevenLabs | OpenAI Realtime |
|--------|-----------|----------------|
| Cost per ~3min reservation call | ~$0.15–0.25 | ~$0.80–1.20 |
| SDK | `useConversation` React hook | Manual WebRTC + DataChannel events |
| Structured data extraction | `clientTools` callback | `function_call` DataChannel events |
| Transcript | `onMessage` callback | `history_added` events |
| Next.js App Router fit | Drop-in | Requires careful SSR guards |

### Architecture

```
index.tsx (mode state: null | "type" | "talk")
  ├── TalkOrTypeScreen.tsx   — initial choice (rendered when mode === null)
  ├── ChatEngine.tsx         — unchanged type flow (rendered when mode === "type")
  └── VoiceAgent.tsx         — ElevenLabs session (rendered when mode === "talk")
                               ↑ loaded via dynamic(() => import(...), { ssr: false })

app/api/voice-session/route.ts  — GET → returns ElevenLabs signed URL (server-side only)
lib/elevenlabs.ts               — thin helper: getSignedUrl()
lib/coercePartialData.ts        — converts ElevenLabs params to ReservationData shape
```

### State Model in `index.tsx`

Add `mode: null | "type" | "talk"` alongside `isOpen`. Extract a `useReservationMode` custom hook to own `mode` and `partialData` — this keeps `index.tsx` as a thin rendering shell:

```tsx
// hooks/useReservationMode.ts
export function useReservationMode() {
  const [mode, setMode] = useState<null | "type" | "talk">(null);
  const [partialData, setPartialData] = useState<Partial<ReservationData>>({});

  const handleSwitchToType = (data: Partial<ReservationData>) => {
    setPartialData(data);
    setMode("type");
  };

  const handleClose = () => {
    setMode(null);
    setPartialData({});
  };

  return { mode, setMode, partialData, handleSwitchToType, handleClose };
}
```

When the popup closes, mode resets to `null`. Both modes share `chatOpen` + `setChatOpen` from `page.tsx`.

### Talk → Type Escape Hatch with Data Carry-Over

If a guest switches from Talk to Type mid-session, any data collected verbally is passed up via `onSwitchToType(partialData: Partial<ReservationData>)` callback. `index.tsx` passes this into `ChatEngine` as `initialData`, pre-populating completed steps.

**Step-jump policy (decided):** ChatEngine always opens at step 1 regardless of `initialData`. Pre-populated fields are still applied at each step as the guest pages through. This avoids complexity in the animation system. `initialData` merges at state initialization only, via `coercePartialData`.

**VoiceAgent is responsible** for translating ElevenLabs string schema → `Partial<ReservationData>` before calling `onSwitchToType`. This boundary must not cross into `index.tsx`.

---

## Technical Approach

### Phase 1: Mode Selection Screen

**`components/ChatWidget/TalkOrTypeScreen.tsx`**

Replaces the initial bot question. Shows two large buttons:

```
┌──────────────────────────────────┐
│  Welcome to Carbone. How would   │
│  you prefer to connect?          │
│                                  │
│  [ 🎙 Talk ]   [ ⌨ Type ]      │
└──────────────────────────────────┘
```

- Keyboard accessible (`tabIndex`, `onKeyDown`)
- Oswald/Cormorant brand fonts matching existing chat style
- Props: `onSelectType: () => void; onSelectTalk: () => void` — no `setMode` passed directly

**`index.tsx` changes:**

```tsx
// VoiceAgent loaded via dynamic import (SSR safety)
const VoiceAgent = dynamic(
  () => import("./VoiceAgent"),
  { ssr: false, loading: () => <ConnectingView /> }
);

// In component body
const { mode, setMode, partialData, handleSwitchToType, handleClose } = useReservationMode();

// Render
{isOpen && mode === null && (
  <TalkOrTypeScreen
    onSelectType={() => setMode("type")}
    onSelectTalk={() => setMode("talk")}
  />
)}
{isOpen && mode === "type" && (
  <ChatEngine onClose={handleClose} initialData={partialData} />
)}
{isOpen && mode === "talk" && (
  <VoiceAgent
    onClose={handleClose}
    onSwitchToType={handleSwitchToType}
  />
)}
```

`ChatEngine` needs `initialData?: Partial<ReservationData>` prop. Merge happens at state initializer:

```tsx
// In ChatEngine.tsx — initialData merges once at mount
const [state, dispatch] = useReducer(
  chatReducer,
  { ...INITIAL_DATA, ...coercePartialData(initialData) }
);
```

**Research Insights:**

- **SSR Safety**: `dynamic(..., { ssr: false })` must wrap `VoiceAgent` from the *parent* (`index.tsx`). Self-wrapping inside `VoiceAgent.tsx` does not prevent Next.js from bundling the module in the server chunk. The `loading` fallback prevents blank flash during chunk download.
- **Data type boundary**: `ReservationData.date` is `Date | null` but ElevenLabs params pass date as `"YYYY-MM-DD"` string. `coercePartialData` handles conversion.

### Phase 2: Server-Side Session Endpoint

**`app/api/voice-session/route.ts`**

```tsx
import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/elevenlabs";

export async function GET(request: Request) {
  // CSRF: reject cross-origin requests
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const signedUrl = await getSignedUrl();
    return NextResponse.json({ signedUrl });
  } catch {
    return NextResponse.json({ error: "Failed to create voice session" }, { status: 503 });
  }
}
```

Environment variables needed:
- `ELEVENLABS_API_KEY` — ElevenLabs API key (server-only, never exposed, never `NEXT_PUBLIC_` prefix)
- `ELEVENLABS_AGENT_ID` — the pre-configured agent ID from the ElevenLabs dashboard (treat as secret, never `NEXT_PUBLIC_` prefix)

Add to `.env.local` (and Vercel dashboard for production). Document both in `CLAUDE.md` env vars table.

**`lib/elevenlabs.ts`**

```tsx
// Validate at module load — fails fast during build or first request
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
  throw new Error(
    "Missing required environment variables: ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID"
  );
}

interface SignedUrlResponse {
  signed_url: string;
}

function isSignedUrlResponse(value: unknown): value is SignedUrlResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "signed_url" in value &&
    typeof (value as SignedUrlResponse).signed_url === "string"
  );
}

export async function getSignedUrl(): Promise<string> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
    {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
  const body: unknown = await res.json();
  if (!isSignedUrlResponse(body)) throw new Error("Unexpected ElevenLabs response shape");
  return body.signed_url;
}
```

**`lib/coercePartialData.ts`**

Converts ElevenLabs param shapes to `Partial<ReservationData>` — required for Talk→Type carry-over and ChatEngine `initialData`:

```tsx
import { ReservationData, LOCATIONS } from "@/types/reservation";

export function coercePartialData(
  raw: Partial<Record<string, unknown>>
): Partial<ReservationData> {
  const result: Partial<ReservationData> = {};

  if (typeof raw.firstName === "string") result.firstName = raw.firstName;
  if (typeof raw.lastName === "string") result.lastName = raw.lastName;
  if (typeof raw.phone === "string") result.phone = raw.phone;
  if (typeof raw.specialNote === "string") result.specialNote = raw.specialNote;
  if (typeof raw.partySize === "number") result.partySize = raw.partySize;

  // Validate location against allowlist
  if (typeof raw.location === "string") {
    const valid = LOCATIONS.map((l) => l.city);
    if (valid.includes(raw.location)) result.location = raw.location;
  }

  // Convert YYYY-MM-DD string to Date
  if (typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    const d = new Date(raw.date + "T00:00:00Z");
    if (!isNaN(d.getTime())) result.date = d;
  }

  if (
    raw.timeSlot === "early" ||
    raw.timeSlot === "prime" ||
    raw.timeSlot === "late"
  ) {
    result.timeSlot = raw.timeSlot;
  }

  return result;
}
```

**Security headers — `next.config.ts`:**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "microphone=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Research Insights:**

- **Signed URL TTL**: ElevenLabs signed URLs are valid for **15 minutes** (not 60 seconds as originally noted). The conversation continues past URL expiry once initiated.
- **Pre-fetch strategy**: Fetch the signed URL when the chat widget opens (`isOpen` → `true`), not when the user clicks "Talk". By the time the user navigates to voice mode, the URL is already in hand. Store in a ref (not state) to avoid re-renders.
- **Rate limiting**: For MVP, Origin header check + env var validation is sufficient. Track IP-based rate limiting as a follow-up before any public launch.

### Phase 3: ElevenLabs Agent Configuration (Dashboard)

Before any frontend code, the ElevenLabs agent must be configured. The system prompt is the most critical dependency.

**Agent system prompt (enhanced with location descriptors and seating hours):**

```
You are the voice concierge for Carbone, the celebrated Italian-American restaurant.
You are warm, refined, and efficient. Your only job is to collect a dinner reservation request.

Collect these fields in this exact order:
1. First name and last name
2. Best phone number (US format: 10 digits; international: include + and country code)
3. Which Carbone location. Options and how guests may refer to them:
   - New York (West Village, "the original")
   - Miami (South Beach)
   - Las Vegas (ARIA)
   - Dallas (Highland Park Village)
   - Hong Kong (Central)
   - London (Mayfair)
   - Dubai (DIFC)
   - Doha (Al Maha Island)
   - Riyadh (Kingdom Centre)
   When a guest says the neighborhood, resolve it to the city name.
4. Preferred date (must be today or a future date; ask in plain language, confirm with full date)
5. Party size (1 to 20 guests)
6. Preferred seating time:
   - Early Seating: 5:30–7:00 PM → use value "early"
   - Prime Seating: 7:00–9:00 PM → use value "prime"
   - Late Seating: 9:00–11:00 PM → use value "late"

After collecting all fields, spell back the guest's name letter by letter and their
phone number digit by digit. Ask: "Is that correct?"
- If yes → call the submitReservation tool immediately.
- If no → ask which field to correct, collect the correction, spell it back again, then confirm.

When submitReservation succeeds, say exactly: "Your reservation request has been received.
A member of our concierge team will contact you within 24 hours to confirm."

Do not discuss anything else. If the guest goes off-topic, politely redirect.
Keep all responses concise — one sentence per question.
```

**Client tool definition in dashboard (enhanced descriptions):**

```json
{
  "name": "submitReservation",
  "description": "Called after guest confirms all details are correct. Submits the reservation request.",
  "parameters": {
    "type": "object",
    "properties": {
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "phone": {
        "type": "string",
        "description": "US numbers as 10 digits or (NXX) NXX-XXXX. International with + prefix (e.g. +442071234567). Max 30 characters."
      },
      "location": {
        "type": "string",
        "description": "Exact city name: New York, Miami, Las Vegas, Dallas, Hong Kong, London, Dubai, Doha, or Riyadh"
      },
      "date": { "type": "string", "description": "YYYY-MM-DD format. Must be today or future." },
      "partySize": { "type": "integer", "minimum": 1, "maximum": 20 },
      "timeSlot": {
        "type": "string",
        "enum": ["early", "prime", "late"],
        "description": "early=5:30-7pm, prime=7-9pm, late=9-11pm"
      },
      "specialNote": { "type": "string" }
    },
    "required": ["firstName", "lastName", "phone", "location", "date", "partySize", "timeSlot"]
  }
}
```

### Phase 4: VoiceAgent Component

**`components/ChatWidget/VoiceAgent.tsx`**

```tsx
"use client";
import { useConversation } from "@elevenlabs/react";
```

**State machine (discriminated union):**

```tsx
type VoiceAgentState =
  | { status: "idle" }
  | { status: "requesting-mic" }
  | { status: "fetching-session" }
  | { status: "connecting" }
  | { status: "connected"; conversationId: string }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "mic-denied" }
  | { status: "error"; message: string; code: VoiceErrorCode };

type VoiceErrorCode =
  | "MIC_DENIED"
  | "SIGNED_URL_FAILED"
  | "CONNECTION_FAILED"
  | "SUBMISSION_FAILED";
```

**Key implementation details:**

**1. Mic permission + session start (serialized, not parallel):**

```tsx
// Guard against double-tap
const isInitiatingRef = useRef(false);

const handleStartTalk = async () => {
  if (isInitiatingRef.current) return;
  isInitiatingRef.current = true;
  setState({ status: "requesting-mic" });

  // Step 1: get mic FIRST (iOS Safari requires gesture chain)
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;
  } catch (err) {
    const name = (err as Error).name;
    if (name === "NotAllowedError") {
      setState({ status: "mic-denied" });
    } else {
      setState({ status: "error", code: "MIC_DENIED", message: "No microphone found." });
    }
    isInitiatingRef.current = false;
    return;
  }

  // Step 2: THEN fetch signed URL (only after mic is confirmed)
  setState({ status: "fetching-session" });
  let signedUrl: string;
  try {
    const res = await fetch("/api/voice-session");
    if (!res.ok) throw new Error();
    const data = await res.json();
    signedUrl = data.signedUrl;
  } catch {
    setState({ status: "error", code: "SIGNED_URL_FAILED", message: "Unable to connect." });
    isInitiatingRef.current = false;
    return;
  }

  // Step 3: start session
  setState({ status: "connecting" });
  try {
    const conversationId = await conversation.startSession({
      signedUrl,
      connectionType: "webrtc",
      preferHeadphonesForIosDevices: true,
      connectionDelay: { android: 3000, ios: 0, default: 0 },
    });
    setState({ status: "connected", conversationId });
  } catch {
    setState({ status: "error", code: "CONNECTION_FAILED", message: "Could not connect to agent." });
  }
  isInitiatingRef.current = false;
};
```

**2. Double-endSession guard:**

```tsx
const sessionEndedRef = useRef(false);

const safeEndSession = useCallback(async () => {
  if (sessionEndedRef.current) return;
  sessionEndedRef.current = true;
  await conversation.endSession();
}, [conversation]);

// Reset on retry
const handleRetry = () => {
  sessionEndedRef.current = false;
  setState({ status: "idle" });
  handleStartTalk();
};
```

**3. Transcript — functional setState + mounted guard:**

```tsx
const isMountedRef = useRef(true);
useEffect(() => {
  return () => { isMountedRef.current = false; };
}, []);

const conversation = useConversation({
  // Use `role` (not deprecated `source`)
  onMessage: ({ message, role }) => {
    if (!isMountedRef.current) return;
    // Functional updater avoids stale closure
    setMessages((prev) => [
      ...prev,
      { role, text: message, ts: Date.now() },
    ]);
  },

  onDisconnect: (details) => {
    // NEVER call endSession() here — causes double-close error
    if (!isMountedRef.current) return;
    if (details.reason === "error") {
      setState({ status: "error", code: "CONNECTION_FAILED", message: details.message });
    }
    // reason === "user" means we called endSession — no UI change needed
    // reason === "agent" means agent ended — show success or idle
  },

  onError: (message) => {
    if (!isMountedRef.current) return;
    setState({ status: "error", code: "CONNECTION_FAILED", message });
  },
});
```

**4. `submitReservation` client tool — with Zod validation:**

```tsx
import { z } from "zod";

const SubmitReservationSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().max(30),
  location: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  timeSlot: z.enum(["early", "prime", "late"]),
  specialNote: z.string().optional(),
});

// In useConversation clientTools:
clientTools: {
  submitReservation: async (params: unknown): Promise<string> => {
    // Validate before POSTing — agent output is untrusted
    const parsed = SubmitReservationSchema.safeParse(params);
    if (!parsed.success) {
      return "Validation failed. Please ask guest to repeat the details.";
    }

    if (!isMountedRef.current) return "Component unmounted.";
    setState({ status: "submitting" });

    const abortController = new AbortController();
    submissionAbortRef.current = abortController;

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Source": "voice" },
        body: JSON.stringify(parsed.data),
        signal: abortController.signal,
      });
      if (!res.ok) throw new Error();

      if (!isMountedRef.current) return "Component unmounted.";
      setState({ status: "success" });
      await safeEndSession();
      return "Reservation submitted successfully.";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "Submission cancelled.";
      if (!isMountedRef.current) return "Component unmounted.";
      setState({ status: "error", code: "SUBMISSION_FAILED", message: "Submission failed." });
      return "Submission failed. Please try again or switch to typing.";
    }
  },
},
```

**5. Cleanup on unmount (mic stream + session):**

```tsx
useEffect(() => {
  return () => {
    isMountedRef.current = false;
    // Stop mic tracks — prevents recording indicator from persisting
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    // Cancel any in-flight submission
    submissionAbortRef.current?.abort();
    // End session (fire-and-forget on unmount)
    safeEndSession();
  };
}, [safeEndSession]);
```

**6. Speaking indicator — isolated component (no re-render cascade):**

```tsx
// Separate component so isSpeaking changes don't re-render message list
function SpeakingDot({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.5rem",
        height: "0.5rem",
        borderRadius: "50%",
        background: "var(--gold)",
        marginLeft: "0.4rem",
        // CSS animation only — no JS execution during pulse
        animation: isSpeaking ? "pulse 1s ease-in-out infinite" : "none",
      }}
    />
  );
}
// CSS in <style> tag:
// @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
```

**7. Retry — stop existing mic stream first:**

```tsx
const handleRetry = async () => {
  // Stop existing stream before requesting a new one
  micStreamRef.current?.getTracks().forEach((t) => t.stop());
  micStreamRef.current = null;
  // Cancel any in-flight fetch
  sessionFetchAbortRef.current?.abort();
  // Reset guards
  sessionEndedRef.current = false;
  isInitiatingRef.current = false;
  setState({ status: "idle" });
  // Start fresh
  await handleStartTalk();
};
```

**Error states:**

| Error | Code | UI |
|-------|------|-----|
| Mic denied | `MIC_DENIED` | Bot bubble: "Microphone access was denied. [Switch to typing →]" |
| `/api/voice-session` fails | `SIGNED_URL_FAILED` | Bot bubble: "Unable to connect. [Try again] or [Switch to typing →]" |
| ElevenLabs disconnects mid-session | `CONNECTION_FAILED` | Bot bubble: "Connection lost. [Reconnect] or [Switch to typing →]" |
| `/api/reservations` fails | `SUBMISSION_FAILED` | Bot bubble: "Something went wrong. [Try again] or [Switch to typing →]" |

**Research Insights:**

- **`role` not `source`**: `onMessage` callback uses `role: "user" | "agent"` (not deprecated `source: "user" | "ai"`). Update all UI rendering accordingly.
- **`onDisconnect` signature**: Receives `DisconnectionDetails` with `reason: "user" | "agent" | "error"`. Use `reason` to decide whether to show an error message.
- **Pre-fetch optimization**: Fetch signed URL when `isOpen` transitions to `true`, store in a ref. By the time user clicks "Talk", URL is ready. 15-minute TTL is ample.
- **`isSpeaking` isolation**: Keep `SpeakingDot` as its own component outside the messages list to prevent message list re-renders on every agent audio frame.
- **Android audio delay**: `connectionDelay: { android: 3000 }` prevents garbled audio on Android devices that need time to switch audio mode.

---

## Files to Create / Modify

### New files
- `components/ChatWidget/TalkOrTypeScreen.tsx`
- `components/ChatWidget/VoiceAgent.tsx`
- `app/api/voice-session/route.ts`
- `lib/elevenlabs.ts`
- `lib/coercePartialData.ts`

### Modified files
- `components/ChatWidget/index.tsx` — add `mode` state (via hook), dynamic import VoiceAgent, render three branches
- `components/ChatWidget/ChatEngine.tsx` — accept optional `initialData?: Partial<ReservationData>` prop
- `next.config.ts` — add security headers (`X-Frame-Options`, `Permissions-Policy: microphone=(self)`)
- `.env.local` — add `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`
- `CLAUDE.md` — add both env vars to the environment variables table

### New dependencies
```bash
npm install @elevenlabs/react zod
```

> Note: `zod` may already be installed (common in Next.js projects). Check `package.json` first.

---

## Implementation Phases

### Phase 1 — Foundation (no voice yet)
- Add `useReservationMode` hook
- Create `TalkOrTypeScreen.tsx`
- Add `initialData` prop + `coercePartialData` to `ChatEngine.tsx`
- Add security headers to `next.config.ts`
- Build and test mode selection → Type flow carries partial data ✅

### Phase 2 — Server endpoint
- `lib/elevenlabs.ts` + `lib/coercePartialData.ts` + `app/api/voice-session/route.ts`
- Pre-fetch signed URL on widget open (store in ref in `index.tsx`)
- Test that signed URL is returned (curl `/api/voice-session` locally)

### Phase 3 — VoiceAgent shell
- Install `@elevenlabs/react` and `zod`
- Create `VoiceAgent.tsx` with mic permission + serialized session connect/disconnect
- Wire `useConversation` hooks (`onConnect`, `onDisconnect`, `onError`)
- Test: connection established, `isSpeaking` indicator works, `status` transitions correctly

### Phase 4 — Transcript + submission
- Wire `onMessage` (use `role`, functional setState) to chat bubbles
- Wire `submitReservation` client tool with Zod validation → POST `/api/reservations`
- Test happy path end-to-end (including success message back to agent)

### Phase 5 — Error states + polish
- All error states with correct `VoiceErrorCode` routing
- Switch-to-Type with `coercePartialData` carry-over
- Speaking indicator (`SpeakingDot` isolated component, CSS animation)
- Double-tap guard, retry with stream cleanup, unmount cleanup
- ESC key closes session + popup

---

## Acceptance Criteria

### Mode Selection
- [ ] Mode selection screen shown before any questions on every popup open
- [ ] "Talk" and "Type" buttons keyboard-accessible (Tab + Enter)
- [ ] Mode resets when popup closes

### Type Mode
- [ ] Completely unchanged from Issue #5 implementation
- [ ] If switched from Talk with partial data, those fields are pre-populated
- [ ] ChatEngine always starts at step 1 (not jumps to first incomplete step)

### Talk Mode — Happy Path
- [ ] Mic permission serialized: acquired BEFORE signed URL fetch
- [ ] Double-tap guard: second click ignored while session is initiating
- [ ] Voice agent greets guest and asks each field in order
- [ ] Guest speech transcribed (using `role`, not `source`) and appears as chat bubbles
- [ ] Agent spells name letter-by-letter and phone digit-by-digit before submitting
- [ ] Guest confirms → `submitReservation` tool fires with Zod-validated params → POST to `/api/reservations`
- [ ] Agent receives `"Reservation submitted successfully."` return value → speaks confirmation
- [ ] Success bubble shown (same as Type flow)

### Talk Mode — Error States
- [ ] Mic denied → `MIC_DENIED` error bubble + "Switch to typing" link
- [ ] `/api/voice-session` fails → `SIGNED_URL_FAILED` error bubble + retry + switch link
- [ ] ElevenLabs disconnect mid-session → `CONNECTION_FAILED` from `onDisconnect` `reason === "error"`
- [ ] `endSession()` never called inside `onDisconnect` handler
- [ ] Retry stops existing mic stream before requesting new one
- [ ] `/api/reservations` POST fails → `SUBMISSION_FAILED` error bubble + retry
- [ ] "Switch to typing" at any point carries over collected data via `coercePartialData`

### Cleanup & Safety
- [ ] `safeEndSession` guard prevents double-endSession on happy path
- [ ] Mic stream tracks stopped on unmount (recording indicator disappears)
- [ ] Submission AbortController cancelled on unmount
- [ ] `isMountedRef` check before any `setState` in async callbacks
- [ ] Functional setState in `onMessage` (no stale closure)

### Server
- [ ] `ELEVENLABS_API_KEY` never exposed to browser (no `NEXT_PUBLIC_` prefix)
- [ ] `ELEVENLABS_AGENT_ID` never exposed to browser (no `NEXT_PUBLIC_` prefix)
- [ ] `/api/voice-session` returns 503 if env vars missing
- [ ] `/api/voice-session` rejects cross-origin requests (Origin header check)
- [ ] Security headers present: `X-Frame-Options: DENY`, `Permissions-Policy: microphone=(self)`
- [ ] `submitReservation` tool params validated with Zod before POSTing
- [ ] `X-Source: voice` header on reservation POST for log differentiation
- [ ] Existing `/api/reservations` unchanged

### Accessibility / UX
- [ ] Speaking indicator (pulsing dot) visible while agent is speaking — CSS animation only
- [ ] `SpeakingDot` isolated component (no message list re-renders on isSpeaking change)
- [ ] ESC closes popup (ends session cleanly via safeEndSession)
- [ ] Works on localhost (HTTP is a secure context for getUserMedia)
- [ ] Works on Vercel (HTTPS satisfies secure context requirement)
- [ ] `preferHeadphonesForIosDevices: true` set for iOS audio output
- [ ] `connectionDelay: { android: 3000 }` set for Android audio mode switching

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| ElevenLabs agent prompt not configured before dev starts | Write and test system prompt first (Phase 3 dependency) |
| ElevenLabs signed URLs expire after 15 minutes | Pre-fetch on widget open; 15 min is ample for normal usage |
| iOS Safari mic: gesture chain broken by async | `getUserMedia` called in direct click handler before any `await` to non-audio API |
| iOS Safari audio output: earpiece not loudspeaker | `preferHeadphonesForIosDevices: true` in useConversation options |
| `@elevenlabs/react` SSR import issues | `dynamic(() => import(...), { ssr: false })` in parent `index.tsx` |
| Double endSession (happy path) | `safeEndSession` ref guard; never call in `onDisconnect` |
| `overrides` not enabled in dashboard → silent disconnect | Don't pass overrides unless enabled in ElevenLabs dashboard settings |
| ElevenLabs transcription quality for non-English names | Spell-back step catches errors; Type fallback always available |
| Agent-native parity: time slot hours not communicated | System prompt includes explicit hour ranges for each slot |
| Agent success message inconsistent | Tool returns `"Reservation submitted successfully."` → agent reads confirmation |
| `/api/voice-session` abuse (cost amplification) | Origin header check for MVP; IP rate limiting as follow-up |

---

## References

### Internal
- `components/ChatWidget/ChatEngine.tsx` — existing useReducer pattern to mirror
- `components/ChatWidget/index.tsx:6` — existing isOpen/FAB state model
- `types/chat.ts` — `ChatMessage`, `ChatStep` types
- `types/reservation.ts` — `ReservationData`, `LOCATIONS`, `TIME_SLOTS`
- `app/api/reservations/route.ts` — submission endpoint (add `X-Source` header logging)
- `lib/db.ts` — Neon DB pattern

### External
- ElevenLabs Next.js example: https://github.com/elevenlabs/elevenlabs-examples/tree/main/examples/conversational-ai/nextjs
- `@elevenlabs/react` npm: https://www.npmjs.com/package/@elevenlabs/react
- ElevenLabs signed URL endpoint: `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=<AGENT_ID>`
- ElevenLabs React SDK docs: https://elevenlabs.io/docs/agents-platform/libraries/react
- ElevenLabs Next.js quickstart: https://elevenlabs.io/docs/eleven-agents/guides/quickstarts/next-js
- ElevenLabs client tools docs: https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools
- Related PR: #12 (Issue #5 chat popup — prerequisite)
