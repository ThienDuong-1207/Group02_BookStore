# Group02 Book Store – Release 1.0

Online bookstore website for the Software Project Management final project (72ITSE41503, Van Lang University, HK261) – **Team 02**.

| | |
|---|---|
| Production | _to be added (Vercel, `main`)_ |
| Staging | _to be added (Vercel, `develop`)_ |
| Demo admin | `admin@bookstore.demo` / _see Final Report_ |
| Demo customer | `customer@bookstore.demo` / _see Final Report_ |
| Jira board | https://dctthien1201.atlassian.net/jira/software/projects/GB/boards/2 |

**Read first:** [`PROJECT_SPEC.md`](PROJECT_SPEC.md) (scope, user stories, AC) · [`CONTRIBUTING.md`](CONTRIBUTING.md) (Git workflow, PR rules).

## Stack
Next.js 15 (App Router, TypeScript, Tailwind) · Supabase (PostgreSQL + Auth + Storage, RLS) · Vercel · Vitest · GitHub Actions.

## Run locally
```bash
npm install
cp .env.example .env.local          # fill in the Supabase staging keys
npm run dev                          # http://localhost:3000
```

## Database (Supabase CLI via npx)
```bash
npx supabase login
npx supabase init                    # first time only – creates supabase/config.toml, keeps existing migrations
npx supabase link --project-ref <staging-ref>
npx supabase db push                 # applies supabase/migrations/*.sql
npm run db:types                     # regenerate src/types/database.ts
npm run db:seed                      # ≥ 30 sample books + demo users (US-23)
```

## Quality checks (same as CI)
```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Team
Dương Chí Thiện (repo admin, Sprint 1 Leader) · Bùi Gia Phát (Sprint 2 Leader) · Dương Ngọc Linh Đan (Product Owner, Sprint 3 Leader)
