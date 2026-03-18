---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security, voice-agent]
dependencies: []
---

# CSRF Origin Check Uses Substring Match — Bypassable via Domain Spoofing

## Problem Statement

`/api/voice-session` uses `origin.includes(host)` to guard against cross-origin requests. This is a substring check, not an equality check — a domain like `evil-carbone.com` would pass when `host` is `carbone.com` because `"https://evil-carbone.com".includes("carbone.com")` is `true`. Additionally, requests without an `Origin` header (e.g. `curl`, server-to-server) bypass the check entirely since it short-circuits on `origin && host`.

**Why it matters:** The endpoint proxies a request to ElevenLabs and returns a signed WSS URL. Every successful bypass generates a billable conversation against the ElevenLabs account.

## Findings

- **File:** `app/api/voice-session/route.ts` line 16
- **Current code:** `if (origin && host && !origin.includes(host))`
- **Bypass 1:** Attacker registers `evil-carbone.com` → `origin.includes("carbone.com")` is `true` → passes
- **Bypass 2:** curl request with no Origin header → `origin` is null → entire check skipped → passes
- **Flagged by:** security-sentinel (P2), architecture-strategist (P1), agent-native-reviewer (P3)

## Proposed Solutions

### Option A — URL-parsed host comparison + reject missing Origin (Recommended)
```ts
const origin = request.headers.get("origin");
const host = request.headers.get("host");
// Browser-only endpoint — reject requests without Origin
if (!origin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
try {
  if (new URL(origin).host !== host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
} catch {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```
**Pros:** Exact domain boundary enforcement, rejects headless requests, handles malformed origins.
**Cons:** Slightly more code; `new URL()` could throw on malformed Origin values (handled by try/catch above).
**Effort:** Small. **Risk:** None — strictly tighter.

### Option B — Strict allowlist
Maintain a `ALLOWED_ORIGINS = ["https://carbone.vercel.app", "http://localhost:3000"]` array and compare exactly.
**Pros:** Explicit, easy to audit.
**Cons:** Requires maintenance when domain changes; must stay in sync with Vercel deploy URLs.
**Effort:** Small. **Risk:** Low operational risk of forgetting to update.

## Recommended Action

Option A. Deploy-agnostic and requires zero configuration.

## Technical Details

- **Affected files:** `app/api/voice-session/route.ts`
- **Change scope:** ~10 lines (replace lines 13–18)

## Acceptance Criteria

- [ ] `new URL(origin).host !== host` comparison used instead of `.includes()`
- [ ] Requests without `Origin` header return 403
- [ ] Malformed `Origin` values return 403 (not 500)
- [ ] Requests from `localhost:3000` still succeed in local dev

## Work Log

- 2026-03-18: Identified by security-sentinel and architecture-strategist in PR #17 review
