## Project Overview

Mock Carbone restaurant website with a multi-step reservation request form. Built to demonstrate how a structured contact flow can reduce unstructured email volume for the guest relations team (~60,000 emails/month across 50+ restaurants).

- **Repo:** https://github.com/samfoley702/carbone-reservation
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Neon Postgres · Vercel
- **Local dev:** `npm run dev` → http://localhost:3000
- **Database:** Neon Postgres (pooled connection via `@neondatabase/serverless`)

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main page — assembles all sections, owns `formOpen` state |
| `app/globals.css` | All custom CSS — design tokens, form animations, component styles |
| `app/layout.tsx` | Google Fonts loaded here (`Cormorant_Garamond`, `Oswald`) |
| `app/api/reservations/route.ts` | POST handler — validates and inserts into Neon |
| `lib/db.ts` | Neon SQL client singleton |
| `types/reservation.ts` | Shared TS types + `LOCATIONS` + `TIME_SLOTS` constants |
| `components/ReservationForm/FormEngine.tsx` | Step state, transitions, keyboard nav, submission |
| `components/ReservationForm/steps/` | One file per form step (StepName through StepConfirmation) |

## Brand Design System

Scraped from carbonenewyork.com — do not deviate from these tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0A1A29` | Page and form background (dark navy) |
| `--bg-elevated` | `#0f2035` | Cards, about section |
| `--cream` | `#FFF9F0` | Primary text, button backgrounds |
| `--cream-muted` | `rgba(255,249,240,0.55)` | Secondary text, placeholders |
| `--gold` | `#C9A84C` | Accents, dividers, step labels |
| `--border` | `rgba(255,249,240,0.12)` | Default borders |
| `--border-active` | `rgba(255,249,240,0.6)` | Focused/selected borders |
| `--font-cormorant` | Cormorant Garamond | Body, headings, form questions |
| `--font-oswald` | Oswald | Nav, labels, uppercase display text |

Buttons have `border-radius: 2px` (minimal). Primary button: cream bg, navy text. Outline: transparent bg, cream border.

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
time_slot    TEXT NOT NULL   -- 'early' | 'prime' | 'late'
special_note TEXT            -- nullable
created_at   TIMESTAMPTZ DEFAULT NOW()
```

## Environment Variables

| Variable | Where to set | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | `.env.local` + Vercel dashboard | Neon pooled connection string |

Never commit `.env.local` — it is covered by `.gitignore`.

## Workflow: GitHub Issues → Pull Requests

Whenever we open a GitHub issue and begin working on it:

1. Create a new branch named `issue-<number>-<short-description>` (e.g. `issue-1-fix-phone-duplication`)
2. Do all work on that branch — never commit directly to `main`
3. When the work is complete, open a pull request on GitHub that references the issue (e.g. "Closes #1" in the PR body)
4. The PR title should match the issue title format: `fix:`, `feat:`, or `refactor:` prefix

```bash
# Example flow for issue #1
git checkout -b issue-1-fix-phone-duplication
# ... make changes ...
git push -u origin issue-1-fix-phone-duplication
gh pr create --title "fix: Phone number duplicates and appends to last_name" --body "Closes #1"
```
