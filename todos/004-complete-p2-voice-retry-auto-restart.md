---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, ux, voice-agent]
dependencies: []
---

# "Try Again" Button Returns to Idle Instead of Auto-Restarting the Session

## Problem Statement

When a voice session fails (network error, connection dropped), `handleRetry` resets state to `"idle"` — requiring the user to manually tap "Start Speaking" again. This is a two-tap retry flow for what should be a one-tap recovery. The text chat form never puts the user in a dead state requiring manual re-initiation.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx` lines 290–297
- **Current behaviour:** `handleRetry` → state = `"idle"` → user must tap "Start Speaking"
- **Expected:** `handleRetry` → immediately restarts the mic → URL → connect sequence
- **Flagged by:** agent-native-reviewer (P2)

## Proposed Solutions

### Option A — Call `handleStartTalk` inside `handleRetry` (Recommended)
```ts
const handleRetry = useCallback(async () => {
  micStreamRef.current?.getTracks().forEach((t) => t.stop());
  micStreamRef.current = null;
  sessionFetchAbortRef.current?.abort();
  sessionEndedRef.current = false;
  isInitiatingRef.current = false;
  setVoiceState({ status: "idle" });
  await handleStartTalk();
}, [handleStartTalk]);
```
**Pros:** One-tap recovery, matches user expectation.
**Cons:** `handleRetry`'s `useCallback` dependency array must include `handleStartTalk`.
**Effort:** Small. **Risk:** Low — same code path as the initial "Start Speaking" tap.

### Option B — Relabel "Try Again" and keep current flow
Change the button label to "Start Over" to set correct expectation.
**Pros:** No code change.
**Cons:** Still requires two taps and is worse UX than Option A.
**Effort:** Trivial. **Risk:** None.

## Recommended Action

Option A.

## Technical Details

- **Affected files:** `components/ChatWidget/VoiceAgent.tsx`
- **Change scope:** ~3 lines in `handleRetry` callback

## Acceptance Criteria

- [ ] Tapping "Try Again" automatically begins the mic → URL → connect sequence
- [ ] No double-tap required after a connection failure
- [ ] The retry correctly resets all guards before re-initiating

## Work Log

- 2026-03-18: Identified by agent-native-reviewer in PR #17 review
