---
status: complete
priority: p3
issue_id: "017"
tags: [code-review, security]
dependencies: []
---

# No Content-Security-Policy Header

## Problem Statement

`next.config.ts` adds several security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) but no `Content-Security-Policy`. CSP is the primary browser defense against XSS and data injection. Without a `connect-src` directive, any injected script can open arbitrary WebSocket connections — including to ElevenLabs endpoints.

## Findings

- **File:** `next.config.ts`, lines 8–13
- **Missing:** `Content-Security-Policy` header
- **Flagged by:** security-sentinel (Low)

## Proposed Solutions

### Option A — Add a starter CSP
```ts
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",  // unsafe-inline needed for Next.js inline scripts
    "connect-src 'self' wss://*.elevenlabs.io https://*.elevenlabs.io https://*.neon.tech",
    "img-src 'self' data: https://cdn.sanity.io",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
  ].join("; ")
}
```
**Pros:** Meaningful protection, locks down WebSocket endpoint allowlist.
**Cons:** Requires testing — Next.js inline scripts may need nonce-based CSP for strict mode.
**Effort:** Medium (requires testing). **Risk:** Medium — too-strict CSP breaks the app.

### Option B — Defer until auth/production hardening phase
Accept the gap for prototype stage.
**Effort:** None now. **Risk:** Low for a prototype with no real user data.

## Recommended Action

Option A when moving toward production. Option B is acceptable for prototype stage.

## Acceptance Criteria

- [ ] CSP header present in `next.config.ts`
- [ ] `connect-src` allows ElevenLabs WebSocket domains
- [ ] App functions normally with CSP enabled (no CSP violations in console)

## Work Log

- 2026-03-19: Identified by security-sentinel in review
