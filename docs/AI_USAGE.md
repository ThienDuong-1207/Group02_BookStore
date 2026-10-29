# AI Usage Declaration

Required by the course brief (Section 4.2): declare the tool, purpose and affected content. This table feeds the Final Report appendix. Every member must be able to explain any AI-assisted content.

| Date | Member | AI tool | Purpose | Affected content (files / PR / document) | Reviewed by |
|---|---|---|---|---|---|
| 27/10/2026 | Dương Chí Thiện | Claude | Draft Master Plan, project spec, Git workflow docs, initial Next.js + Supabase scaffold and DB migrations | `PROJECT_SPEC.md`, `CONTRIBUTING.md`, `.github/*`, `supabase/migrations/*`, `src/lib/supabase/*`, Master Plan workbook | Team |
| 28/10/2026 | Dương Chí Thiện | Claude Code | Implement US-10 register/login/logout (Zod validation, server actions, forms), base layout (header, `/books` placeholder, 404), session middleware, Vitest tests, F1 test cases | `src/lib/validation/auth.ts`, `src/lib/auth/*`, `src/app/(auth)/*`, `src/components/*`, `src/middleware.ts`, `tests/*`, `docs/test-cases/F1.md` (GB-15) | Dương Ngọc Linh Đan (PR #6) |
| 28/10/2026 | Dương Chí Thiện | Claude Code | Admin area skeleton for US-13: middleware guard for `/admin/**`, `requireAdmin()`, admin layout + dashboard menu, 403 page, tests and test cases | `src/lib/supabase/middleware.ts`, `src/lib/auth/profile.ts`, `src/app/admin/*`, `src/app/forbidden/*`, `tests/auth/require-admin.test.ts`, `docs/test-cases/F1.md` (GB-38) | Dương Ngọc Linh Đan (PR #7) |
| 29/10/2026 | Dương Ngọc Linh Đan | Claude (Cowork) | Implement US-23 seed: sample data (33 books, 8 categories, 27 authors, demo accounts), idempotent seed script, data tests, F1 test cases TC-F1-18…23 | `scripts/seed.ts`, `scripts/seed-data.ts`, `tests/seed/seed-data.test.ts`, `docs/test-cases/F1.md`, `README.md` (GB-40) | _reviewer_ |
