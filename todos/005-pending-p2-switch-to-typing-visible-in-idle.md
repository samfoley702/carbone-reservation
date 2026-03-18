---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, ux, voice-agent]
dependencies: []
---

# "Switch to Typing" Button Hidden in Idle State — User Trapped

## Problem Statement

The "Switch to typing instead" link in `VoiceAgent.tsx` is only rendered when `voiceState.status !== "idle"`. A user who tapped "Talk", saw the idle prompt ("Tap the button below to speak…"), and changed their mind has no visible escape path — they must close the entire widget and reopen it to reach the text form. This creates a dead-end UX for the most common change-of-mind moment.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx` lines 536–555
- **Current condition:** `{voiceState.status !== "idle" && <button>Switch to typing instead</button>}`
- **Gap:** Idle state has no switch link visible despite being the most natural moment to switch
- **Flagged by:** agent-native-reviewer (P2)

## Proposed Solutions

### Option A — Always show switch link (Recommended)
```tsx
{/* Always show switch link — user can change mind at any point */}
<button onClick={handleSwitchToType} style={{ ... }}>
  {voiceState.status === "idle" ? "Type instead →" : "Switch to typing instead"}
</button>
```
**Pros:** No trapped state. Consistent escape hatch.
**Cons:** Slightly more visual weight in the idle state alongside "Start Speaking".
**Effort:** Trivial. **Risk:** None.

### Option B — Show only in idle state as secondary text
Show a softer "Prefer typing? →" link only in idle state, positioned below the "Start Speaking" button.
**Pros:** Cleaner hierarchy — "Start Speaking" is primary, switch is secondary.
**Cons:** More conditional logic.
**Effort:** Small. **Risk:** None.

## Recommended Action

Option A — simplest, no trapped state.

## Technical Details

- **Affected files:** `components/ChatWidget/VoiceAgent.tsx`
- **Change scope:** Remove the `voiceState.status !== "idle"` condition (1 line)

## Acceptance Criteria

- [ ] "Switch to typing" link is visible in the idle state
- [ ] Clicking it in idle state correctly calls `onSwitchToType({})` with empty data
- [ ] Link is also visible in all other non-success states (unchanged)

## Work Log

- 2026-03-18: Identified by agent-native-reviewer in PR #17 review
