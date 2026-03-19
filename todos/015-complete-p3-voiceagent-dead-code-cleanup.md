---
status: complete
priority: p3
issue_id: "015"
tags: [code-review, quality, simplicity]
dependencies: ["011"]
---

# VoiceAgent Dead Code — micStreamRef, msgCounter, and Minor Simplifications

## Problem Statement

`VoiceAgent.tsx` has several dead code items identified by the simplicity and performance reviews:

1. **`micStreamRef`** (line 107) — declared, referenced in cleanup (line 230) and retry (lines 301–302), but never assigned a live stream. All cleanup calls are no-ops.
2. **`msgCounter` ref** (line 113) — a manual increment counter used only for message IDs. `prev.length` in the functional updater is equivalent and removes the extra ref.
3. **Arrow wrapper on `safeEndSession`** (line 517) — `onClick={() => safeEndSession()}` should be `onClick={safeEndSession}` since it takes no arguments.
4. **`isMountedRef.current = true` in cleanup effect** (line 227) — redundant because `useRef(true)` already initializes it to `true`. Also, `safeEndSession` in the effect's dependency array (line 235) can trigger cleanup mid-session if the hook re-creates.
5. **`loadingLabel` constant inside component** (lines 334–338) — a pure static map recreated on every render; should be at module scope.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx`
- **Lines:** 107, 113, 227, 230, 235, 301–302, 334–338, 517
- **Flagged by:** performance-oracle, code-simplicity-reviewer, pattern-recognition-specialist

## Proposed Solutions

### Option A — Clean up all five items
- Delete `micStreamRef` declaration and all references
- Replace `msgCounter.current` with `prev.length` in the `setMessages` updater
- Change `onClick={() => safeEndSession()}` to `onClick={safeEndSession}`
- Remove `isMountedRef.current = true` from the cleanup effect; remove `safeEndSession` from its dep array
- Move `loadingLabel` to module scope above the component

**Effort:** Small. **Risk:** None — all are dead code or no-ops.

## Acceptance Criteria

- [ ] `micStreamRef` removed entirely
- [ ] `msgCounter` ref removed; message IDs derived from array length
- [ ] `loadingLabel` is at module scope
- [ ] Cleanup effect has empty dependency array and no redundant flag assignment
- [ ] No unnecessary arrow wrappers on stable callbacks

## Work Log

- 2026-03-19: Identified by performance-oracle and code-simplicity-reviewer in review
