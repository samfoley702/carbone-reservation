---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, quality, yagni]
dependencies: []
---

# Redundant `onKeyDown` Handlers on Native `<button>` Elements

## Problem Statement

Both buttons in `TalkOrTypeScreen.tsx` have explicit `onKeyDown` handlers that fire `onSelectTalk()` or `onSelectType()` for Enter and Space keys. Native HTML `<button>` elements already fire `onClick` for Enter and Space — these handlers are not needed, add dead code weight, and create a double-invocation risk where both `onKeyDown` and `onClick` fire on the same keypress.

## Findings

- **File:** `components/ChatWidget/TalkOrTypeScreen.tsx` lines 66, 115
- **Current code:**
  ```tsx
  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectTalk()}
  ```
- This is YAGNI — the browser already handles this for `<button>` elements
- **Flagged by:** code-simplicity-reviewer (P1 — YAGNI violation)

## Proposed Solutions

### Option A — Delete both `onKeyDown` handlers (Recommended)
Remove lines 66 and 115 entirely.
**Pros:** Correct behavior, -2 lines, no double-invocation risk.
**Cons:** None.
**Effort:** Trivial. **Risk:** None — native button behavior is unchanged.

## Recommended Action

Option A. This is a clean deletion.

## Technical Details

- **Affected files:** `components/ChatWidget/TalkOrTypeScreen.tsx`
- **Change scope:** Delete 2 lines

## Acceptance Criteria

- [ ] `onKeyDown` handlers removed from both Talk and Type buttons
- [ ] Enter and Space keypresses still activate buttons (native behavior)
- [ ] No double-invocation on keypress

## Work Log

- 2026-03-18: Identified by code-simplicity-reviewer in PR #17 review
