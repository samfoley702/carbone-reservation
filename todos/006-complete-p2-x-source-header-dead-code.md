---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, architecture, voice-agent]
dependencies: []
---

# `X-Source: "voice"` Header Sent But Never Read Server-Side

## Problem Statement

`VoiceAgent.tsx` sends `"X-Source": "voice"` on every POST to `/api/reservations`. The server route never reads this header. There is no `source` column in the database. The header is completely dead code that creates a false impression of source-tracking without actually tracking anything. Voice-sourced reservations are indistinguishable from text-sourced ones in the database or logs.

## Findings

- **File:** `components/ChatWidget/VoiceAgent.tsx` line 173
- **Server:** `app/api/reservations/route.ts` — header never read
- **Database:** `reservation_requests` table has no `source` column
- **Flagged by:** agent-native-reviewer (P1/P2)

## Proposed Solutions

### Option A — Add `source` column and persist it (Recommended)
```sql
ALTER TABLE reservation_requests ADD COLUMN source TEXT NOT NULL DEFAULT 'type';
```
Then in `app/api/reservations/route.ts`:
```ts
const source = request.headers.get("X-Source") ?? "type";
// include in INSERT:
INSERT INTO reservation_requests (... source ...) VALUES (... $9 ...)
```
**Pros:** Enables analytics on voice vs text adoption. Fulfills the stated intent of the header.
**Cons:** Requires a schema migration (small).
**Effort:** Small. **Risk:** Low — additive migration with DEFAULT.

### Option B — Log it without persisting
```ts
const source = request.headers.get("X-Source") ?? "type";
console.log(`[reservations] source=${source}`);
```
**Pros:** No migration. Immediately useful for debugging Vercel logs.
**Cons:** Doesn't survive log rotation; not queryable.
**Effort:** Trivial. **Risk:** None.

### Option C — Remove the header from VoiceAgent (simplest)
Delete `"X-Source": "voice"` from the fetch headers. No server changes needed.
**Pros:** Eliminates dead code.
**Cons:** Loses future extensibility if source tracking is added later.
**Effort:** Trivial. **Risk:** None.

## Recommended Action

Option A if analytics matter. Option C if this is a demo/prototype. For the current prototype context, Option C is appropriate.

## Technical Details

- **Affected files:** `components/ChatWidget/VoiceAgent.tsx`, optionally `app/api/reservations/route.ts`
- **Optional migration:** New `source TEXT DEFAULT 'type'` column

## Acceptance Criteria

- [ ] Either: `source` column exists and is written as `"voice"` for voice submissions
- [ ] Or: `X-Source` header is removed from `VoiceAgent.tsx` (dead code gone)
- [ ] No code sends a header that is silently ignored

## Work Log

- 2026-03-18: Identified by agent-native-reviewer in PR #17 review
