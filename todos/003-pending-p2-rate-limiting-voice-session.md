---
status: pending
priority: p2
issue_id: "003"
tags: [code-review, security, performance, voice-agent]
dependencies: ["001"]
---

# No Rate Limiting on `/api/voice-session` — Billable ElevenLabs Abuse Risk

## Problem Statement

Every GET to `/api/voice-session` makes a paid API call to ElevenLabs and returns a signed WebSocket URL. There is no per-IP throttle, token bucket, or request cap. An attacker who passes the CSRF check (or abuses it, see todo 001) can call this endpoint in a tight loop — generating hundreds of signed URLs per second, each representing a potential billable conversation.

This is the highest business-risk finding: it could run up significant charges before anyone notices.

## Findings

- **File:** `app/api/voice-session/route.ts`
- **Current:** No throttle of any kind
- **Attack surface:** Unauthenticated GET endpoint, guest-facing
- **Flagged by:** security-sentinel (P2)

## Proposed Solutions

### Option A — Vercel Edge middleware with IP-based rate limit (Recommended)
Use `@upstash/ratelimit` with the free Upstash Redis tier (or Vercel KV):
```ts
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 per IP per minute
  prefix: "voice-session",
});

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== "/api/voice-session") return;
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```
**Pros:** Industry standard, works at edge, no additional infra beyond Upstash free tier.
**Cons:** Requires Upstash account and two new env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
**Effort:** Medium. **Risk:** Low (fail-open if Redis is down).

### Option B — In-memory IP tracking (quick, no extra deps)
Track request timestamps in a `Map` in the route handler. Works per-server-instance only.
**Pros:** No new dependencies or infrastructure.
**Cons:** Resets on each serverless invocation (effectively no protection on Vercel edge). Not production-safe.
**Effort:** Small. **Risk:** Ineffective in serverless environment.

### Option C — Defer until auth is added
If user authentication is planned, rate limiting becomes trivially enforceable per-user. Defer this todo until then, accepting the risk for now.
**Pros:** No work now.
**Cons:** Real financial exposure window.
**Effort:** None now. **Risk:** High if the site is discovered.

## Recommended Action

Option A if the site goes public before auth is added. Option C if auth is imminent.

## Technical Details

- **Affected files:** `middleware.ts` (new), `app/api/voice-session/route.ts`
- **New dependencies:** `@upstash/ratelimit`, `@upstash/redis`
- **New env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Acceptance Criteria

- [ ] 6th request from same IP within 60 seconds returns 429
- [ ] Legitimate use (≤5 voice sessions per minute) is unaffected
- [ ] Rate limit state persists across serverless invocations

## Work Log

- 2026-03-18: Identified by security-sentinel in PR #17 review
