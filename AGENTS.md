# PROJECT SPEC – E-Commercial Book Store, Release 1.0 (Team 02)

> **Purpose of this file.** This is the single source of truth for building Release 1.0. It is written so that an AI coding assistant (Claude Code, Cursor, Copilot…) or a new team member can read it and implement any user story correctly.
> Put it in the repository root. To have AI tools load it automatically, also copy it as `CLAUDE.md` (Claude Code) and/or `AGENTS.md` (Cursor, Codex and others), or reference it from those files.
>
> Source: the course brief *HK261_SPM_FinalProject* and the team Master Plan v0.1 (`HK261_SPM_FP_Team02_MasterPlan_v0.1.xlsx`). If this file and the brief disagree, **the brief wins**. Tell the team; don't guess.

---

## 0. Rules for AI assistants (read first)

1. **Work on one user story at a time**, the one you were asked to build. Do not build features from other stories or anything in the *Out of scope* list (§3.2).
2. **The Acceptance Criteria (AC) in §7 are the contract.** Every AC (main, exception, boundary) must be implemented *and* covered by at least one automated test or one written test case.
3. **Never commit to `main` or `develop`.** Work on a branch named `feature/GB-<jira-id>-<short-slug>` and open a Pull Request into `develop` (see `CONTRIBUTING.md`).
4. **Use Conventional Commits:** `feat(books): add soft delete (GB-23)`. Put the Jira key in every commit and PR title.
5. **Before opening a PR, run** `npm run lint && npm run typecheck && npm test && npm run build`. All must pass.
6. **Validate on both client and server.** Never trust client input. Every admin action must check the role **on the server**.
7. **Keep each change small.** Tasks are planned in 2-hour units, so one PR should cover one story or half a story.
8. **Do not add new dependencies, change the DB schema or change the tech stack** without saying so clearly in the PR description. Schema changes need a Supabase migration file in `supabase/migrations/`.
9. **Log your work in `docs/AI_USAGE.md`.** The course requires declaring AI tool, purpose and affected content. Append a row there for each PR you helped with.
10. **If a requirement is unclear, stop and ask** the Product Owner (Dương Ngọc Linh Đan). Write the question in the PR or the Jira issue. Don't invent behaviour.
11. **Every team member must be able to explain the code.** Prefer simple, readable code over clever code, and comment non-obvious logic.

---

## 1. Project overview

| Item | Value |
|---|---|
| Course | Software Project Management (72ITSE41503), Van Lang University, Semester 261 |
| Customer / Sponsor | Lecturer, Dr. Bui Minh Phung (plays "Ms. Le's book company") |
| Product | Online bookstore website, **Release 1.0 – Book Catalogue** |
| Process | Scrum, 3 one-week Sprints (Fri → Thu) |
| Timeline | 23/10/2026 → 17/11/2026 (final presentation 07:00 Tue 17/11) |
| PM tool | Jira Software, project **GB** (Group02_BookStore) |
| Repository | One GitHub repo; lecturer invited; no direct commits to `main` |
| Hosting | Vercel (app) + Supabase (database, auth, storage), free tiers; **must stay online until 17/11/2026** |

Grading note: the software is evidence that the plan was executed. It is graded **against the Acceptance Criteria**, not on technical sophistication. A **working, tested, deployed** feature beats an ambitious unfinished one.

---

## 2. Team

| Member | Scrum role | Sprint Leader | Main dev areas |
|---|---|---|---|
| Dương Chí Thiện | Developer | Sprint 1 (23/10–29/10) | Repo/DB setup, auth (US-10), book CRUD (US-05, US-15), pagination (US-20), search/filter (US-01, US-09, US-25), release |
| Bùi Gia Phát | Developer | Sprint 2 (30/10–05/11) | Roles & admin accounts (US-13, US-14), deployment (US-24), soft delete (US-16), card grid (US-19), detail page (US-02), responsive (US-21) |
| Dương Ngọc Linh Đan | **Product Owner** + Developer | Sprint 3 (06/11–12/11); Closure coordinator | Backlog & AC, seed data (US-23), categories/authors/stock (US-17, US-18, US-06), not-found handling (US-22), test cases, UAT |

**Repository admin: Dương Chí Thiện** (owner; full control of settings, rulesets, secrets, tags). The PO accepts finished stories. Every PR needs **1 approval from a member who did not write it** (Thiện's PR → Đan or Phát; Phát's PR → Thiện or Đan; Đan's PR → Thiện or Phát). The admin also works through branches and PRs, with no direct commits.

---

## 3. Scope

### 3.1 In scope: Release 1.0 features (all mandatory)

| ID | Feature | Minimum requirements (from the brief) |
|---|---|---|
| **F1** | System administration (accounts & roles) | Register, log in, log out; admin creates/locks accounts; ≥ 2 roles (Administrator, Customer); admin functions blocked for unauthorised users |
| **F2** | Book management | Add, edit, delete books (title, author, category, price > 0, description, cover image, stock); manage categories and authors; validate input; **deleted books are hidden (no hard delete)** |
| **F3** | Book list | Grid/card layout (cover, title, author, price); **12 books/page**, **newest first**; responsive on desktop, tablet, phone |
| **F4** | Book details | Selecting a book in F3 opens its detail page; non-existent ID → friendly message; going back returns to **the same list page** |
| **F5** | Search / filter | Search by title or author; filter by category and price range; **works together with F3 pagination** |

### 3.2 Out of scope (do NOT build)
Shopping cart, checkout, payment, orders, order history, revenue dashboard, reviews/ratings, social login. (Backlog items US-03, US-04, US-07, US-08, US-11, US-12 are *Future release*.) **No "Add to Cart" button anywhere.**

### 3.3 Non-functional requirements

| NFR | Requirement | How we verify |
|---|---|---|
| NFR-1 | Responsive UI (desktop ≥ 1024 px, tablet 768 px, phone 375 px) | Screenshots at 3 widths in the PR |
| NFR-2 | ≥ 30 sample books in the database | Seed script; count on the list page |
| NFR-3 | List page loads in **< 2 s** with sample data | Lighthouse / DevTools on the hosted site; record the result |
| NFR-4 | Client- and server-side validation | Tests call the API/server action directly with invalid data |
| NFR-5 | Passwords stored as hashes | Supabase Auth stores bcrypt hashes in `auth.users`; our tables never hold passwords |
| NFR-6 | Hosted on a free server, reachable by the lecturer | Public URL + demo accounts in README and Final Report |

---

## 4. Tech stack & architecture

> **Team decision (confirmed): Next.js + Supabase + Vercel.** Supabase provides the PostgreSQL database, authentication and file storage in one free project, so we need no ORM, no separate auth library and no separate image host.

| Layer | Choice |
|---|---|
| Framework | **Next.js 14+ (App Router) + TypeScript** (UI + Server Actions / Route Handlers) |
| Styling | Tailwind CSS (mobile-first) |
| Database | **Supabase PostgreSQL** with **Row Level Security (RLS)** on every table |
| Data access | `@supabase/supabase-js` + **`@supabase/ssr`** (cookie-based sessions in Server Components, Server Actions and middleware). Generated types: `supabase gen types typescript` → `src/types/database.ts` |
| Auth | **Supabase Auth (email + password)**. Passwords are hashed by Supabase (bcrypt) and stored in `auth.users`; we never handle hashes ourselves. Role and lock status live in `public.profiles` |
| Admin operations | Server-only Supabase client with the **service-role key** (create users, ban/unban). **Never import it in client code** |
| Storage | **Supabase Storage**, public bucket `book-covers` (public read, admin-only write) |
| Migrations & seed | **Supabase CLI**: `supabase/migrations/*.sql` (schema, RLS, views) and a seed script (`scripts/seed.ts`) that creates demo auth users via the Admin API and inserts ≥ 30 books |
| Validation | **Zod** schemas shared by client forms and server actions |
| Tests | Vitest (validation, query builders, role checks); Playwright optional for E2E/UAT smoke tests |
| CI | GitHub Actions: lint → typecheck → test → build on every PR |
| Hosting | **Vercel**: `main` = production, `develop` = staging, every PR gets a preview URL |

**Supabase project settings**
- Free plan allows 2 projects → **`bookstore-staging`** (used by `develop` and PR previews) and **`bookstore-prod`** (used by `main`). Apply the same migrations to both.
- *Authentication → Providers → Email*: enabled; **turn off "Confirm email"** so registration logs the user in immediately (US-10 M1), and set the minimum password length to 8.
- ⚠️ **Free projects pause after 7 days without activity.** The site must stay online until 17/11/2026, so the repo includes a scheduled GitHub Action (`.github/workflows/keep-alive.yml`) that queries both projects every 3 days. Also check the dashboard before each Sprint Review.

### 4.1 Folder structure (target)

```
/
├─ PROJECT_SPEC.md          ← this file (also CLAUDE.md / AGENTS.md)
├─ CONTRIBUTING.md          ← Git workflow
├─ README.md                ← how to run, hosted URL, demo accounts
├─ docs/
│  ├─ AI_USAGE.md           ← AI usage declaration log (required by the course)
│  ├─ test-cases/           ← F1.md … F5.md (Given–When–Then → steps → expected → actual)
│  └─ release-notes.md
├─ supabase/
│  ├─ config.toml
│  └─ migrations/           ← 0001_schema.sql, 0002_rls.sql, 0003_views.sql …
├─ scripts/
│  └─ seed.ts               ← demo users (Admin API) + ≥ 30 books; idempotent
├─ src/
│  ├─ app/
│  │  ├─ (public)/          ← /, /books, /books/[id]
│  │  ├─ (auth)/            ← /login, /register
│  │  ├─ admin/             ← /admin/** (role ADMIN only)
│  │  │  ├─ books/  categories/  authors/  users/
│  │  └─ api/               ← route handlers if needed
│  ├─ components/           ← BookCard, Pagination, SearchBar, FilterPanel, forms…
│  ├─ lib/
│  │  ├─ supabase/          ← server.ts, client.ts, admin.ts (service role, server-only), middleware.ts
│  │  ├─ auth/              ← getCurrentProfile(), requireAdmin()
│  │  ├─ validation/        ← zod schemas
│  │  └─ queries/           ← listBooks(), getBook() …
│  ├─ types/database.ts     ← generated by Supabase CLI
│  └─ middleware.ts         ← refreshes session + protects /admin/**
└─ tests/
```

---

## 5. Data model (Supabase / PostgreSQL)

```sql
-- 0001_schema.sql
create type public.user_role      as enum ('ADMIN', 'CUSTOMER');
create type public.account_status as enum ('ACTIVE', 'LOCKED');

-- One row per auth user (auth.users holds email + password hash)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null check (char_length(full_name) between 1 and 100),
  phone       text check (phone ~ '^0[0-9]{9}$'),
  role        public.user_role      not null default 'CUSTOMER',
  status      public.account_status not null default 'ACTIVE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 100),
  is_hidden   boolean not null default false,          -- "delete" = hide
  created_at  timestamptz not null default now()
);
create unique index categories_name_ci on public.categories (lower(name));

create table public.authors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 150),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index authors_name_ci on public.authors (lower(name));

create table public.books (
  id           uuid primary key default gen_random_uuid(),
  title        text    not null check (char_length(title) between 1 and 200),
  description  text    not null check (char_length(description) between 1 and 5000),
  price        integer not null check (price > 0),        -- VND
  stock        integer not null default 0 check (stock >= 0),
  cover_url    text,
  author_id    uuid not null references public.authors(id),
  category_id  uuid not null references public.categories(id),
  deleted_at   timestamptz,                               -- soft delete; null = visible
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index books_list_idx  on public.books (created_at desc, id desc) where deleted_at is null;
create index books_cat_idx   on public.books (category_id);
create index books_price_idx on public.books (price);

-- Auto-create a profile when a user registers (full_name/phone come from signUp options.data)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          nullif(new.raw_user_meta_data->>'phone', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper used by RLS policies
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'ADMIN' and status = 'ACTIVE');
$$;
```

```sql
-- 0003_views.sql : what customers are allowed to see (used by F3, F4, F5)
create view public.books_public with (security_invoker = true) as
select b.id, b.title, b.description, b.price, b.stock, b.cover_url, b.created_at,
       b.category_id, c.name as category_name,
       b.author_id,   a.name as author_name
from public.books b
join public.authors a    on a.id = b.author_id
join public.categories c on c.id = b.category_id
where b.deleted_at is null and a.is_hidden = false and c.is_hidden = false;
```

**RLS policies (0002_rls.sql) – enable RLS on every table**

| Table / bucket | anon & customers | ADMIN (`is_admin()`) |
|---|---|---|
| `books` | `select` only rows with `deleted_at is null` | full `select/insert/update`; **no `delete` policy for anyone** (soft delete only) |
| `categories`, `authors` | `select` where `is_hidden = false` | `select/insert/update` |
| `profiles` | user can `select` own row; can update own `full_name`/`phone` only | `select` all; `update role/status` |
| Storage `book-covers` | public read | insert/update/delete |

**Global query rules**
- Customer pages read from **`books_public`** only. Admin pages read from `books` (and may show deleted rows).
- List ordering: `created_at desc, id desc` so pagination stays stable.
- Pagination with `.range(from, to)` and `{ count: 'exact' }`. Never load all rows.
- Only the server-only admin client may use the service-role key. Everything else goes through RLS.

---

## 6. Pages, routes and access

| Route | Who | Purpose | Story |
|---|---|---|---|
| `/register` | Guest | Customer registration | US-10 |
| `/login`, logout action | Guest / logged in | Login / logout | US-10 |
| `/` → redirects to `/books` | All | Home = book list | US-19 |
| `/books?page=&q=&category=&minPrice=&maxPrice=` | All | Book list + search + filter + pagination (**state lives in the URL**) | US-19, 20, 01, 09, 25 |
| `/books/[id]` | All | Book detail | US-02, US-22 |
| `/admin` | ADMIN | Admin dashboard (links only) | US-13 |
| `/admin/books`, `/admin/books/new`, `/admin/books/[id]/edit` | ADMIN | Book CRUD, stock, soft delete | US-05, 15, 16, 06 |
| `/admin/categories` | ADMIN | Category CRUD/hide | US-17 |
| `/admin/authors` | ADMIN | Author CRUD/hide | US-18 |
| `/admin/users` | ADMIN | Create / lock / unlock accounts | US-14 |

**Access control (US-13), three layers:**
1. `middleware.ts` (via `@supabase/ssr`) refreshes the session. On `/admin/**` it redirects guests to `/login` and sends non-admins to a 403 page: "You do not have permission to access this page."
2. Every admin Server Action / Route Handler starts with `await requireAdmin()`, which reads the profile **on the server** and throws 403 if `role ≠ ADMIN` or `status = LOCKED`.
3. **RLS** in the database blocks writes even if layers 1–2 were bypassed.

---

## 7. User stories & Acceptance Criteria (Release 1.0)

Format: **Given / When / Then**. Each story lists **M** = main flow, **E** = exception, **B** = boundary. SP = Story Points (Planning Poker, reference US-02 = 2 SP). The Jira key column is filled in by the team.

### Sprint plan overview

| Sprint | Dates | Leader | Goal | Stories (SP) |
|---|---|---|---|---|
| **Sprint 1** | 23/10 – 29/10 | Thiện | PMP v1.0 approved; customers register/log in, admin manages accounts by role; site hosted | US-10 (5), US-13 (3), US-14 (3), US-23 (2), US-24 (2) = **15 SP** |
| **Sprint 2** | 30/10 – 05/11 | Phát | Admin manages books/categories/authors; paginated book list; Change Request processed | US-05 (5), US-15 (3), US-16 (2), US-17 (2), US-18 (2), US-06 (2), US-19 (3), US-20 (2) = **21 SP** |
| **Sprint 3** | 06/11 – 12/11 | Đan | Details + search/filter on any device; Release v1.0 accepted through UAT | US-21 (3), US-02 (2), US-22 (2), US-01 (3), US-09 (3), US-25 (2) = **15 SP** |

---

### SPRINT 1: F1 + foundations

#### US-10 Register, log in, log out · F1 · 5 SP · Must · Owner: Thiện · Jira: GB-__
*As a customer, I want to register an account and log in, so that I can save my information.*
- **M1** Given I am a guest on `/register`, when I submit a valid full name, email, password and (optional) phone, then my account is created with role CUSTOMER and status ACTIVE, I am logged in and redirected to `/books`.
- **M2** Given I have an active account, when I log in with the correct email and password, then I am logged in and the header shows my name and a Logout button.
- **M3** Given I am logged in, when I click Logout, then my session ends and I return to `/books` as a guest.
- **E1** Given the email is already registered, when I submit the form, then I see "This email is already registered" and no account is created.
- **E2** Given I enter a wrong email or password, when I log in, then I see "Incorrect email or password" (don't reveal which one was wrong).
- **E3** Given my account is LOCKED, when I log in with correct credentials, then I see "Your account has been locked. Please contact the administrator" and I am not logged in.
- **B1** Password must be **8–64 characters with at least one letter and one digit**. 7 characters is rejected, 8 is accepted. Email must be a valid format. Phone, if given, must be **10 digits starting with 0**.
- **B2** Validation errors are shown next to the field **on the client**, and the server rejects the same invalid data if the client check is bypassed (test by calling the server action directly).
- **B3** Passwords are handled only by Supabase Auth (`auth.users.encrypted_password` is a bcrypt hash). No password column exists in `public` tables.
- *Implementation:* `supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })`; the `handle_new_user` trigger creates the profile. On login, if `profiles.status = 'LOCKED'`, sign the user out immediately and show E3 (the account is also banned in Auth, see US-14).

#### US-13 Two roles + block admin functions · F1 · 3 SP · Must · Owner: Phát · Jira: GB-__
*As the system owner, I want admin functions restricted to administrators, so that customers cannot change the catalogue.*
- **M1** Given I am logged in as ADMIN, when I open `/admin`, then I see the admin menu (Books, Categories, Authors, Users).
- **M2** Given I am logged in as CUSTOMER, then no admin link is shown in the header.
- **E1** Given I am a guest, when I open any `/admin/**` URL, then I am redirected to `/login`.
- **E2** Given I am a CUSTOMER, when I open any `/admin/**` URL, then I see a 403 page "You do not have permission to access this page."
- **E3** Given I am a CUSTOMER or guest, when I call any admin server action/API directly, then the server returns 403 and no data changes.
- **B1** If an admin's account is locked while logged in, their next admin request is rejected (status is checked on the server, not only at login).

#### US-14 Admin creates and locks/unlocks accounts · F1 · 3 SP · Must · Owner: Phát · Jira: GB-__
*As an admin, I want to create accounts and lock/unlock them, so that I can control who uses the system.*
- **M1** Given I am an admin on `/admin/users`, then I see a list of users with name, email, role, status and created date.
- **M2** Given valid data (name, email, password, role), when I create an account, then it appears in the list with status ACTIVE.
- **M3** Given an ACTIVE user, when I click Lock and confirm, then the status becomes LOCKED and that user can no longer log in. When I click Unlock, they can log in again.
- *Implementation (server-only admin client):* create = `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })` then set `profiles.role`; lock = set `profiles.status = 'LOCKED'` **and** `auth.admin.updateUserById(id, { ban_duration: '876000h' })`; unlock = status `ACTIVE` + `ban_duration: 'none'`.
- **E1** Creating an account with an existing email shows "This email is already registered".
- **E2** An admin cannot lock **their own** account: the button is disabled and the server rejects it.
- **B1** The same validation rules as US-10 B1 apply.

#### US-23 Database design + seed ≥ 30 sample books · Enabler · 2 SP · Must · Owner: Đan · Jira: GB-__
- **M1** Given an empty database, when I run `supabase db push && npm run db:seed`, then the DB contains **≥ 30 books**, ≥ 5 categories, ≥ 10 authors, 1 admin and 1 customer demo account.
- **M2** Every seeded book has title, author, category, price > 0, description, stock ≥ 0 and a working cover image URL. At least 2 books have stock = 0 (to test "Sold Out").
- **B1** Seeded books have **different `createdAt` values** so "newest first" ordering is visible and deterministic.
- **B2** Running the seed twice does not create duplicates (upsert by name/title; skip existing auth users).
- Cover images: upload the seed covers to the `book-covers` bucket (or use stable public image URLs).
- Demo accounts (credentials come from env vars, listed in README): `admin@bookstore.demo` / `customer@bookstore.demo`.

#### US-24 Deploy to free hosting · Enabler · 2 SP · Must · Owner: Phát · Jira: GB-__
- **M1** Given the repo is connected to Vercel, when code is merged to `develop`, then the staging URL updates automatically. Merging to `main` updates the production URL.
- **M2** Every PR gets a preview deployment link.
- **M3** Environment variables (Supabase URL, anon key, **service-role key**, seed passwords) are set in Vercel per environment and **never committed**. `.env.example` lists them without values.
- **B1** The production URL is reachable without logging in to Vercel, from a phone on mobile data.

---

### SPRINT 2: F2 book management + F3 book list

#### US-05 Add a new book · F2 · 5 SP · Must · Owner: Thiện · Jira: GB-__
*As an admin, I want to add books with images and details, so that customers can browse the latest catalogue.*
- **M1** Given I am an admin on `/admin/books/new`, when I enter title, select author and category, enter price, description, stock and upload a cover, and click Save, then the book is created and I see "Book added".
- **M2** The new book appears **first** on the customer list page (newest first) immediately.
- **E1** Required fields missing (title, author, category, price, description) → field-level error, nothing saved.
- *Implementation:* upload the cover to Storage bucket `book-covers` at `books/<uuid>.<ext>`, save the public URL in `cover_url`.
- **E2** Cover file not JPG/PNG/WebP or larger than **2 MB** → "Cover must be a JPG, PNG or WebP image up to 2 MB".
- **B1** Price: `0` rejected, negative rejected, non-numeric rejected, `1` accepted. Price must be > 0 (VND, integer).
- **B2** Stock: integer ≥ 0. `-1` rejected, `0` accepted.
- **B3** Title 1–200 chars. Description 1–5000 chars.
- **B4** The server re-validates everything with the same Zod schema.

#### US-15 Edit book · F2 · 3 SP · Must · Owner: Thiện · Jira: GB-__
- **M1** Given an existing book, when I open Edit, the form is pre-filled. When I change fields and Save, the changes appear on the list and detail pages.
- **M2** Leaving the cover empty keeps the current cover. Uploading a new one replaces it.
- **E1** Same validation as US-05 (E1, B1–B4).
- **E2** Editing a soft-deleted or non-existent book ID shows "Book not found".

#### US-16 Soft delete book · F2 · 2 SP · Must · Owner: Phát · Jira: GB-__
- **M1** Given a book in the admin list, when I click Delete and confirm, then `deletedAt` is set and the book disappears from the customer list, search and detail page.
- **M2** The record **still exists** in the database (no hard delete; RLS has no DELETE policy on `books`).
- **E1** Cancelling the confirmation changes nothing.
- **B1** Opening `/books/<deleted-id>` shows the friendly not-found message (US-22).
- *(Optional, only if time allows)* An admin filter "Show deleted" with a Restore action.

#### US-17 Manage categories · F2 · 2 SP · Must · Owner: Đan · Jira: GB-__
- **M1** An admin can add, rename and hide categories on `/admin/categories`.
- **E1** Duplicate name (case-insensitive) → "Category already exists".
- **E2** Hiding a category that still has visible books is blocked with "Move or delete the books in this category first" (keeps the catalogue consistent).
- **B1** Name 1–100 chars, trimmed. Empty or whitespace-only is rejected.
- Hidden categories don't appear in the filter panel or the book form dropdown.

#### US-18 Manage authors · F2 · 2 SP · Must · Owner: Đan · Jira: GB-__
Same AC as US-17 applied to authors (name 1–150 chars; duplicate → "Author already exists"; hiding an author with visible books is blocked).

#### US-06 Stock update + "Sold Out" label · F2 · 2 SP · Should · Owner: Đan · Jira: GB-__
- **M1** The admin book list shows each book's stock. The admin can change stock (inline or in Edit) and save.
- **M2** Books with stock = 0 show a **"Sold Out"** badge on the customer card and detail page.
- **B1** Stock must be an integer ≥ 0. Changing 1 → 0 shows the badge, 0 → 1 removes it.

#### US-19 Book card grid, newest first · F3 · 3 SP · Must · Owner: Phát · Jira: GB-__
*As a customer, I want to browse books in a grid, so that I can quickly see what's available.*
- **M1** Given I open `/books`, then I see book cards with **cover, title, author, price** (formatted `120.000 ₫`).
- **M2** Books are ordered **newest first** (`createdAt DESC`).
- **M3** Clicking a card opens `/books/[id]`.
- **E1** A book without a cover shows a placeholder image. Very long titles are truncated to 2 lines with an ellipsis.
- **E2** No books at all → "No books available yet."
- **B1** Soft-deleted books and books in hidden categories/authors never appear.

#### US-20 Pagination 12/page + performance · F3 · 2 SP · Must · Owner: Thiện · Jira: GB-__
- **M1** The list shows **exactly 12 books per page** (fewer on the last page) with page controls (Prev, numbers, Next).
- **M2** The page number is in the URL (`?page=3`). Reloading or sharing the URL shows the same page.
- **E1** `?page=0`, negative, non-numeric → page 1. `page` > last page → last page (or a "no books" message with a link to page 1).
- **B1** With 30 books: page 1 = 12, page 2 = 12, page 3 = 6. Prev is disabled on page 1, Next on page 3.
- **B2** Pagination is done in the database (`skip/take` + count), not by loading all books.
- **B3 (NFR-3)** The hosted list page loads in < 2 s with seed data. Record the measurement in the PR.

---

### SPRINT 3: F4 details + F5 search/filter + responsive

#### US-02 Book detail page · F4 · 2 SP · Must · Owner: Phát · Jira: GB-__
*As a customer, I want to see a book's full details, so that I can decide whether it meets my needs.*
- **M1** Given I click a book in the list, then `/books/[id]` shows cover (large), title, author, category, price, stock status (In stock / Sold Out) and full description.
- **M2** There is **no "Add to Cart" button** (out of scope).
- **B1** The page renders correctly on phone, tablet and desktop.

#### US-22 Not-found message + back to the same list page · F4 · 2 SP · Must · Owner: Đan · Jira: GB-__
- **M1** Given I am on `/books?page=3&q=harry`, when I open a book and then click "Back to list" (or the browser Back button), then I return to **page 3 with the same search/filter**.
- **E1** Given the ID does not exist, is malformed or the book is soft-deleted, when I open `/books/<id>`, then I see a friendly page "Sorry, we couldn't find this book." with a button back to the list. HTTP status 404, no stack trace.
- **B1** If the user opened the detail URL directly (no previous list page), "Back to list" goes to `/books` page 1.
- *Implementation hint:* keep list state in the URL and pass it to the detail link (e.g. `/books/[id]?from=<encoded list query>`).

#### US-01 Search by title or author · F5 · 3 SP · Must · Owner: Thiện · Jira: GB-__
- **M1** Given I type a keyword in the search bar (visible on the list page) and press Enter or Search, then the list shows books whose **title or author name contains** the keyword (case-insensitive).
- **M2** The keyword is shown in the search box and kept in the URL (`?q=`).
- **E1** No match → "No books found for '<keyword>'" plus a "Clear search" link.
- **B1** Leading/trailing spaces are trimmed. An empty keyword shows the full list. Max 100 chars.
- **B2** Special characters (`%`, `_`, `'`) are treated as plain text, with no SQL injection (use supabase-js filters, never build raw SQL strings; escape `%`, `_`, `,` and `()` before putting the keyword in an `ilike`/`.or()` filter).

#### US-09 Filter by category and price range · F5 · 3 SP · Must · Owner: Thiện · Jira: GB-__
- **M1** The filter panel has a **category** selector (visible categories only) and **min/max price** inputs. Applying them shows only matching books.
- **M2** "Clear filters" returns to the full list.
- **E1** min > max → "Minimum price cannot be greater than maximum price", filter not applied.
- **E2** Negative or non-numeric prices → validation message.
- **B1** The price range is **inclusive**: min = max = 120000 shows books priced exactly 120,000.
- **B2** Only min or only max is allowed (open-ended range).
- **B3** Filter state is in the URL (`?category=&minPrice=&maxPrice=`).

#### US-25 Search/filter works with pagination · F5 · 2 SP · Must · Owner: Thiện · Jira: GB-__
- **M1** Given search and/or filters return more than 12 books, then results are paginated 12/page and moving between pages **keeps** `q`, `category`, `minPrice`, `maxPrice`.
- **M2** Changing the keyword or a filter resets to page 1.
- **B1** Total page count is based on the **filtered** result count.
- **B2** Search + category + price can be combined (AND logic).

#### US-21 Responsive UI (site-wide) · F3 · 3 SP · Must · Owner: Phát · Jira: GB-__
- **M1** The grid shows **4 columns ≥ 1024 px, 3 at 768 px, 2 at 375 px** (1 column below 360 px is acceptable).
- **M2** Header, search, filter panel (collapsible on phone), detail page and admin pages are usable at 375 px with no horizontal scrolling.
- **B1** Tap targets ≥ 44 px on phone. Images keep their aspect ratio.
- Evidence: screenshots of list, detail and one admin page at 375 / 768 / 1280 px in the PR.

---

## 8. Definition of Ready & Definition of Done

**Definition of Ready (a story can enter a Sprint when):** it follows the user-story format · has Given–When–Then AC covering main, exception and boundary flows · is estimated with Planning Poker · has no blocking dependency · fits in one Sprint.

**Definition of Done, 3 levels**

| Level | Done when | Checked by |
|---|---|---|
| **Story** | Code merged into `develop` via a reviewed PR (1 approval, CI green) · every AC has a test case in `docs/test-cases/` and passes · client + server validation in place · works on the staging URL · Jira issue moved to Done with actual hours logged · PO accepted | Reviewer + PO (Đan) |
| **Sprint** | All committed stories Story-Done; unfinished ones returned to the backlog · `develop` merged to `main` via release PR · tag `sprint-N` · production URL updated · Sprint Report + burndown ready | Sprint Leader |
| **Release** | F1–F5 pass all AC on the **production** URL · regression of F1–F3 passed · tag `v1.0` + `docs/release-notes.md` · UAT signed off · README has URL + demo accounts | Thiện (Release DoD check) + PO + Sponsor |

---

## 9. Test cases

One file per feature in `docs/test-cases/F#.md`, **at least one test case per AC**:

```markdown
| TC ID | Story / AC | Given | When (steps) | Then (expected) | Actual | Pass/Fail | Tester | Date |
|---|---|---|---|---|---|---|---|---|
| TC-F1-03 | US-10 / E1 | Email a@b.com already registered | 1. Open /register 2. Enter a@b.com … 3. Submit | "This email is already registered"; no new user | | | | |
```

Automated tests (Vitest) should cover validation schemas, role checks and query logic (pagination, search, filter). UAT scripts (Sprint 3) map 1-to-1 to the AC in §7.

---

## 10. Git workflow (summary; full rules in `CONTRIBUTING.md`)

- Branches: `main` (production, protected) ← `develop` (integration/staging, protected) ← `feature/GB-<id>-<slug>`, `fix/GB-<id>-<slug>`.
- **No direct pushes** to `main` or `develop`. Everything goes through a Pull Request with **1 approval from another member** and **green CI**.
- Merge strategy: **Squash and merge** into `develop`. At the end of each Sprint, a release PR `develop → main` uses a **merge commit**, then tag `sprint-1`, `sprint-2`, `v1.0`.
- Commit messages: Conventional Commits with the Jira key: `feat(auth): register form validation (GB-12)`.
- Baseline tags for project management: `baseline-v1.0` (PMP approved), `baseline-v1.1` (after the Change Request).

---

## 11. Environment & deployment

`.env.example` (commit this; never commit `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=           # safe for the browser (RLS protects data)
SUPABASE_SERVICE_ROLE_KEY=               # SERVER ONLY – never prefix with NEXT_PUBLIC_
SEED_ADMIN_EMAIL=admin@bookstore.demo
SEED_ADMIN_PASSWORD=
SEED_CUSTOMER_EMAIL=customer@bookstore.demo
SEED_CUSTOMER_PASSWORD=
```
Scripts expected in `package.json`: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `db:types` (`supabase gen types typescript --project-id <ref> > src/types/database.ts`), `db:seed` (`tsx scripts/seed.ts`).

**Database changes:** create a migration with `supabase migration new <name>`, test it locally (`supabase start` + `supabase db reset`) or on staging, commit it in the PR, and apply it with `supabase db push` – first to **staging**, then to **production** at release time (Sprint Leader).

**Vercel:** Production branch = `main` → env vars of `bookstore-prod`. Preview (all other branches, incl. `develop`) → env vars of `bookstore-staging`. Add the Vercel URLs to *Supabase → Authentication → URL Configuration* (Site URL + redirect URLs).

---

## 12. Schedule & milestones

| Date | Milestone |
|---|---|
| Fri 23/10 | Kick-off; Sprint 1 starts |
| Tue 27/10 | **Change Request issued in class** → record in the Change Log (processed in Sprint 2) |
| Thu 29/10 23:59 | Sprint 1 submission (PMP v1.0, workbook, Sprint Report S1) |
| Fri 30/10 | Sprint Review 1 + Retro (in class); Sprint 2 starts |
| ~Mon 02/11 | CCB decision on the CR (PO + Leader + Sponsor) |
| Thu 05/11 23:59 | Sprint 2 submission (+ CR01 document) |
| Fri 06/11 | Sprint Review 2; Sprint 3 starts |
| Wed 11/11 | Release v1.0 tagged and deployed to production |
| Thu 12/11 23:59 | Sprint 3 submission (+ UAT document) |
| Fri 13/11 | Sprint Review 3 + **UAT** with the customer |
| Sun 15/11 23:59 | Final submission (Final Report, slides, final workbook, Eval360) |
| Tue 17/11 07:00 | Final presentation; website must be online |

---

## 13. Change Request log (fill in)

| CR ID | Received | Description | Impact (SP / hours) | CCB decision | New/changed stories |
|---|---|---|---|---|---|
| CR01 | 27/10/2026 | _to be filled after the class session_ | | | |

When a CR is approved: add or adjust stories in §7, re-estimate with Planning Poker, update the Release Plan, and tag `baseline-v1.1`.

---

## 14. Prompt template for AI-assisted work

```
Read PROJECT_SPEC.md and CONTRIBUTING.md.
Implement user story <US-xx> only (Jira GB-<id>), on branch feature/GB-<id>-<slug>.
1. Restate the AC you will implement and list the files you will create/change.
2. Implement with client + server validation and server-side role checks.
3. Add Vitest tests and a test-case table in docs/test-cases/<F#>.md covering every AC.
4. Run lint, typecheck, test, build and fix all errors.
5. Write the PR description using .github/pull_request_template.md
   and append a row to docs/AI_USAGE.md.
Do not touch other stories or out-of-scope features. Ask me if anything is unclear.
```
