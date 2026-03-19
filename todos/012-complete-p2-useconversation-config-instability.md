---
status: complete
priority: p2
issue_id: "012"
tags: [code-review, performance, voice-agent]
dependencies: []
---

# useConversation Config Object Unstable — Risk of Mid-Session Hook Re-initialization

## Problem Statement

`useConversation` is called with an inline config object whose callbacks (`onConnect`, `onDisconnect`, `onError`, `onMessage`, `clientTools.submitReservation`) are recreated as new function references on every render. If the ElevenLabs SDK compares config by reference internally (common for hooks), this can trigger hook re-initialization mid-session, causing the WebSocket to restart unexpectedly.

Additionally, `safeEndSession` (defined at line 208 via `useCallback` depending on `conversation`) feeds into the `clientTools` closure, creating a potential instability loop: `conversation` changes → `safeEndSession` changes → config object changes → `conversation` changes again.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx`, lines 117–206
- **Also:** `safeEndSession` dependency chain (lines 208–218)
- **Flagged by:** performance-oracle (Critical), pattern-recognition-specialist (Medium)

## Proposed Solutions

### Option A — Extract callbacks with useCallback/useMemo
Move all five callbacks and `clientTools` out of the inline config object into stable `useCallback`/`useMemo` references, then pass them into `useConversation`:

```ts
const handleConnect = useCallback(() => { ... }, []);
const handleDisconnect = useCallback((details) => { ... }, []);
const handleError = useCallback((msg) => { ... }, []);
const handleMessage = useCallback(({ message, role }) => { ... }, []);
const clientTools = useMemo(() => ({ submitReservation: async (params) => { ... } }), [safeEndSession]);

const conversation = useConversation({
  preferHeadphonesForIosDevices: true,
  connectionDelay: { android: 3000, ios: 0, default: 0 },
  onConnect: handleConnect,
  onDisconnect: handleDisconnect,
  onError: handleError,
  onMessage: handleMessage,
  clientTools,
});
```
**Effort:** Medium. **Risk:** Low — behavior unchanged, referential stability improves.

### Option B — Use a ref for safeEndSession inside clientTools
Keep the inline config but use a ref for `safeEndSession` inside the tool callback to break the circular dependency:
```ts
const safeEndSessionRef = useRef(safeEndSession);
useEffect(() => { safeEndSessionRef.current = safeEndSession; }, [safeEndSession]);
// Inside clientTools: safeEndSessionRef.current()
```
**Effort:** Small. **Risk:** Low.

## Recommended Action

Option A for full stability. Option B as a targeted fix if A is too disruptive.

## Acceptance Criteria

- [ ] `useConversation` receives referentially stable config across renders
- [ ] No mid-session hook re-initialization in Chrome DevTools React profiler
- [ ] Voice sessions do not restart unexpectedly on re-renders

## Work Log

- 2026-03-19: Identified by performance-oracle and pattern-recognition-specialist in review
