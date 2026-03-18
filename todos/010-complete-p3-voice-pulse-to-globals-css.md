---
status: pending
priority: p3
issue_id: "010"
tags: [code-review, style, consistency]
dependencies: []
---

# `voicePulse` Keyframe Defined in `<style>` Tag Instead of `globals.css`

## Problem Statement

`VoiceAgent.tsx` defines `@keyframes voicePulse` in an inline `<style>` tag at the bottom of the JSX. All other keyframes (`bubbleIn`, `shake`, `heroBreath`, `confirmReveal`, `fadeSlideUp`) live in `globals.css`. This inconsistency means a developer looking for animations must check JSX files, not just the stylesheet.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx` lines 560–565
- **Pattern violation:** All existing keyframes are in `globals.css`
- **Flagged by:** pattern-recognition-specialist (P3), code-simplicity-reviewer (P3)

## Proposed Solutions

### Option A — Move to `globals.css` (Recommended)
Add `@keyframes voicePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } }` to `globals.css` and delete the `<style>` tag.
**Effort:** Trivial. **Risk:** None.

## Recommended Action

Option A.

## Acceptance Criteria

- [ ] `voicePulse` keyframe in `globals.css` alongside other keyframes
- [ ] `<style>` tag removed from `VoiceAgent.tsx`
- [ ] Animation still works

## Work Log

- 2026-03-18: Identified by pattern-recognition-specialist in PR #17 review
