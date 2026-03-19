---
status: complete
priority: p3
issue_id: "016"
tags: [code-review, simplicity, quality]
dependencies: []
---

# Duplicated JSX: Status Bubbles in VoiceAgent and Choice Buttons in TalkOrTypeScreen

## Problem Statement

Two significant JSX duplication patterns were identified:

**1. VoiceAgent status bubbles** — The idle, mic-denied, error, and success states each render near-identical `div` blocks with the same inline style object (~90% identical). `TranscriptBubble` already exists and encapsulates this style; the status states don't use it.

**2. TalkOrTypeScreen choice buttons** — The Talk and Type buttons are structurally identical (~45 lines each), differing only in icon, label, sublabel, and hover border color. 16 lines of imperative `onMouseEnter`/`onMouseLeave` DOM mutation implement hover state that CSS could handle with zero JavaScript.

Estimated reduction: ~90 lines (~11% of affected files).

## Findings

- **VoiceAgent.tsx:** Lines 382–469 (4 near-identical status bubble blocks)
- **TalkOrTypeScreen.tsx:** Lines 64–158 (2 near-identical button blocks); lines 77–84, 125–132 (imperative hover handlers)
- **Flagged by:** code-simplicity-reviewer, pattern-recognition-specialist

## Proposed Solutions

### Option A — Extract shared components

**VoiceAgent:** Create a `StatusBubble` component that accepts `children` and optional `maxWidth`, then replace the four status div blocks with `<StatusBubble>`.

**TalkOrTypeScreen:** Create a local `ChoiceButton` component:
```tsx
function ChoiceButton({ icon, label, sublabel, onClick, hoverColor }: ...) { ... }
```
Replace `onMouseEnter`/`onMouseLeave` with a CSS hover class or Tailwind `hover:` variant.

**Effort:** Medium. **Risk:** Low — purely structural, no logic change.

### Option B — Use TranscriptBubble directly for status states
Pass synthetic `TranscriptMsg` objects to the existing `TranscriptBubble`:
```tsx
<TranscriptBubble msg={{ id: "idle", role: "agent", text: "Welcome! ..." }} />
```
**Pros:** Zero new components.
**Cons:** Couples status rendering to the transcript message type.

## Recommended Action

Option A — extract clean purpose-built sub-components.

## Acceptance Criteria

- [ ] Status bubbles in VoiceAgent share a single style definition
- [ ] TalkOrTypeScreen Talk and Type buttons share a single component
- [ ] Hover state uses CSS, not `onMouseEnter`/`onMouseLeave` DOM mutation

## Work Log

- 2026-03-19: Identified by code-simplicity-reviewer and pattern-recognition-specialist in review
