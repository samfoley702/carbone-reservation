## Project Overview

Mock Carbone restaurant website with a multi-step reservation request form. Built to demonstrate how a structured contact flow can reduce unstructured email volume for the guest relations team (~60,000 emails/month across 50+ restaurants).

- **Repo:** https://github.com/samfoley702/carbone-reservation
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Neon Postgres · Vercel
- **Local dev:** `npm run dev` → http://localhost:3000
- **Database:** Neon Postgres (pooled connection via `@neondatabase/serverless`)

## Database Schema

Table: `reservation_requests` (Neon Postgres)

```sql
id           SERIAL PRIMARY KEY
first_name   TEXT NOT NULL
last_name    TEXT NOT NULL
phone        TEXT NOT NULL
location     TEXT NOT NULL
date         DATE NOT NULL
party_size   INTEGER NOT NULL
preferred_time TEXT NOT NULL -- e.g. '7:30 PM', 15-min increments 5:00-11:00 PM
special_note TEXT            -- nullable
created_at   TIMESTAMPTZ DEFAULT NOW()
```

## Environment Variables

| Variable | Where to set | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | `.env.local` + Vercel dashboard | Neon pooled connection string |
| `ELEVENLABS_API_KEY` | `.env.local` + Vercel dashboard | ElevenLabs API key — server-only, never `NEXT_PUBLIC_` |
| `ELEVENLABS_AGENT_ID` | `.env.local` + Vercel dashboard | ElevenLabs agent ID — server-only, never `NEXT_PUBLIC_` |

Never commit `.env.local` — it is covered by `.gitignore`.

## Workflow: GitHub Issues → Pull Requests

Whenever we open a GitHub issue and begin working on it:

1. **Enter plan mode first** — always use `EnterPlanMode` at the start of an issue to think through the approach before making any changes
2. Create a new branch named `issue-<number>-<short-description>` (e.g. `issue-1-fix-phone-duplication`)
3. Do all work on that branch — never commit directly to `main`
4. When the work is complete, open a pull request on GitHub that references the issue (e.g. "Closes #1" in the PR body)
5. The PR title should match the issue title format: `fix:`, `feat:`, or `refactor:` prefix

```bash
# Example flow for issue #1
git checkout -b issue-1-fix-phone-duplication
# ... make changes ...
git push -u origin issue-1-fix-phone-duplication
gh pr create --title "fix: Phone number duplicates and appends to last_name" --body "Closes #1"
```
