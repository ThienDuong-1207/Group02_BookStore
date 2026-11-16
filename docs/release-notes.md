# Release notes – E-Commercial Book Store v1.0

**Release 1.0 – Book Catalogue** · Team 02 · Software Project Management (72ITSE41503), Van Lang University

| | |
|---|---|
| Tag | `v1.0` → commit `97562d8` (merge of PR #41, `develop` → `main`, 11/11/2026) |
| Production | https://group02-book-store.vercel.app |
| Scope | 23 user stories, 59 story points (Product Backlog v1.2, incl. CR-02) |
| Sprints | S1 23/10 – 29/10 · S2 30/10 – 05/11 · S3 06/11 – 12/11/2026 |
| Baselines | `baseline-v1.0` (end of Sprint 1, PMP v1.0) · `baseline-v1.1` (after CR-02 approval) |

## Features

### F1 – System administration (accounts and roles)
- **US-10:** register, log in, log out. Validation runs on the client and on the server; passwords are hashed by Supabase Auth.
- **US-13:** two roles, Administrator and Customer. Admin pages and actions are blocked at three layers: middleware, a server-side role check, and RLS.
- **US-14:** an admin creates accounts and locks or unlocks them. An admin cannot lock their own account.

### F2 – Book management
- **US-05 / US-15:** add and edit books. Price must be > 0 and stock ≥ 0; the cover image is a URL that is checked before saving. The same Zod rules run on the client and the server.
- **US-16:** soft delete. A deleted book is hidden from customers; the database row is kept.
- **US-17 / US-18:** manage categories and authors: add, rename, hide. Duplicate names are rejected. An item cannot be hidden while it still has visible books.
- **US-06:** stock update with a **Sold Out** label on the list and on the detail page.
- **US-26 (CR-02):** promotions per title: 1–90 %, start and end date (Vietnam calendar days, both included).

### F3 – Book list
- **US-19:** card grid (cover, title, author, price), newest first, placeholder cover when none is set.
- **US-20:** 12 books per page. Pagination runs in the database; the list page loads in under 2 s.
- **US-27 (CR-02):** during a promotion the card shows the original price struck through, the sale price and "-x%".
- **US-29:** shared header and footer; hamburger menu below 768 px.
- **US-21:** responsive on desktop, tablet and phone (1 / 2 / 4 columns), including the admin pages (DEF-07).

### F4 – Book detail
- **US-02:** detail page with cover, title, author, category, price, availability and description. No "Add to Cart".
- **US-22:** friendly "Book not found" page for unknown or deleted ids; "Back to list" returns to the same list page and filters.
- **US-28 (CR-02):** promotional price on the detail page; the original price is shown again after the end date.

### F5 – Search and filter
- **US-01:** search by title or author, ignoring case and Vietnamese accents ("nguyen" finds "Nguyễn").
- **US-09:** filter by category and **original** price range (CR-02). An invalid range shows a message; "Clear filters" resets the list.
- **US-25:** search and filters are kept across pages; changing a condition goes back to page 1.

## Change requests
- **CR-02 – Promotional prices.** Received 27/10, approved by the CCB on 30/10 (option A: split over S2 and S3). Delivered as US-26, US-27, US-28, plus the AC change of US-09. Live on production before the customer deadline of 15/11.

## Database
Supabase PostgreSQL with Row Level Security on every table. Five migrations are in `supabase/migrations/` (schema, RLS, views, promotions, accent-free search). The ERD is in `docs/design/erd.md` (added after v1.0, PR #48). The seed script `npm run db:seed` loads ≥ 30 books, categories, authors and two demo accounts, and can be run again without creating duplicates.

## Quality
- **Automated tests:** 509 Vitest tests pass on this commit; CI (lint, typecheck, test, build) runs on every pull request.
- **Manual test cases:** written per acceptance criterion in `docs/test-cases/F1–F5.md`, with UAT cases in `UAT-S3.md`. A production smoke test runs with `npm run test:uat`.

## Changes on `main` after v1.0
| Date | PR | Change |
|---|---|---|
| 15/11 | #42 | Visual refresh of the home page and list (fonts, motion, loading UI) |
| 16/11 | #47 | Fix: since #42, unknown book ids answered HTTP 200 instead of 404; they answer 404 again (US-22 E1) |

## Known issues
- Vercel **Preview** deployments need the Supabase environment variables for the Preview environment; production is not affected.

## Run locally
```bash
npm ci
cp .env.example .env.local   # fill in the Supabase URL and keys
npm run dev
```
Demo accounts: `admin@bookstore.demo` and `customer@bookstore.demo` (passwords are shared with the lecturer separately).

## Team
Dương Chí Thiện · Bùi Gia Phát · Dương Ngọc Linh Đan (Product Owner)
