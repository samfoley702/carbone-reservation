---
status: complete
priority: p2
issue_id: "011"
tags: [code-review, security, quality]
dependencies: []
---

# Debug console.log Calls Left in Production Code

## Problem Statement

`VoiceAgent.tsx` contains six `console.log` calls that were added for debugging and were never removed. These run in production for every user who opens the voice concierge. Line 283 logs the first 60 characters of the signed WebSocket URL (a time-limited credential), which is a minor but unnecessary information disclosure.

No other file in the ChatWidget directory has any `console.log`.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx`
- **Lines:** 122, 128, 141, 283, 289, 291
- **Flagged by:** security-sentinel (P2), pattern-recognition-specialist (Medium)

Line 283 specifically:
```ts
console.log("[VoiceAgent] Starting session with signedUrl:", signedUrl.slice(0, 60) + "...");
```

## Proposed Solutions

### Option A — Remove all six calls
Delete lines 122, 128, 141, 283, 289, and 291 entirely.
**Effort:** Trivial. **Risk:** None.

### Option B — Gate behind NODE_ENV check
```ts
if (process.env.NODE_ENV === "development") {
  console.log("[VoiceAgent] ...");
}
```
**Pros:** Preserves debugging in local dev.
**Cons:** More lines than just deleting them.

## Recommended Action

Option A — just remove them. They were diagnostic scaffolding; the onError/onDisconnect callbacks provide enough signal.

## Acceptance Criteria

- [ ] No `console.log` calls remain in `VoiceAgent.tsx`
- [ ] No signed URL fragment is logged to the browser console in production

## Work Log

- 2026-03-19: Identified by security-sentinel and pattern-recognition-specialist in review
