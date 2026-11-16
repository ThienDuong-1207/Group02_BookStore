# ERD – E-Commercial Book Store, Release 1.0

Entity-relationship diagram of the Supabase (PostgreSQL) database (US-23 AC3). It is drawn from the migration files, which remain the single source of truth:

| Migration | Content |
|---|---|
| `supabase/migrations/20261027000001_schema.sql` | Types `user_role`, `account_status`; tables `profiles`, `categories`, `authors`, `books`; indexes; trigger `handle_new_user`; function `is_admin()` |
| `supabase/migrations/20261027000002_rls.sql` | Row Level Security policies on every table |
| `supabase/migrations/20261027000003_views.sql` | View `books_public` (what customers may see) |
| `supabase/migrations/20261105000001_promotions.sql` | Table `promotions` (CR-02, US-26) + RLS |
| `supabase/migrations/20261111000001_search_unaccent.sql` | Column `search_text` added to `books_public` (US-01) |

GitHub renders the diagram below. In VS Code, use a Mermaid preview extension.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has one (created by trigger handle_new_user)"
    AUTHORS ||--o{ BOOKS : "writes"
    CATEGORIES ||--o{ BOOKS : "groups"
    BOOKS ||--o| PROMOTIONS : "has at most one"

    AUTH_USERS {
        uuid id PK
        text email
        text encrypted_password "bcrypt hash, managed by Supabase Auth (NFR-5)"
        text banned_until "set when an admin locks the account"
    }
    PROFILES {
        uuid id PK, FK "= auth.users.id, on delete cascade"
        text email UK
        text full_name "1-100 chars"
        text phone "optional, 10 digits starting with 0"
        user_role role "ADMIN | CUSTOMER, default CUSTOMER"
        account_status status "ACTIVE | LOCKED, default ACTIVE"
        timestamptz created_at
        timestamptz updated_at
    }
    CATEGORIES {
        uuid id PK
        text name UK "1-100 chars, unique ignoring case"
        boolean is_hidden "hide instead of delete"
        timestamptz created_at
    }
    AUTHORS {
        uuid id PK
        text name UK "1-150 chars, unique ignoring case"
        boolean is_hidden "hide instead of delete"
        timestamptz created_at
    }
    BOOKS {
        uuid id PK
        text title "1-200 chars"
        text description "1-5000 chars"
        integer price "VND, > 0"
        integer stock ">= 0, 0 = Sold Out"
        text cover_url "image URL (no file upload)"
        uuid author_id FK
        uuid category_id FK
        timestamptz deleted_at "soft delete, null = visible"
        timestamptz created_at "list order: newest first"
        timestamptz updated_at
    }
    PROMOTIONS {
        uuid id PK
        uuid book_id FK, UK "one promotion per title"
        integer discount_percent "1-90"
        date start_date "Vietnam calendar day, inclusive"
        date end_date ">= start_date, inclusive"
        timestamptz created_at
        timestamptz updated_at
    }
```

## View `books_public`

Read by every customer page (F3, F4, F5): `books` joined with `authors` and `categories`. It keeps only books where `deleted_at is null`, the author is not hidden and the category is not hidden.

| Column | Source |
|---|---|
| `id`, `title`, `description`, `price`, `stock`, `cover_url`, `created_at`, `category_id`, `author_id` | `books` |
| `category_name` | `categories.name` |
| `author_name` | `authors.name` |
| `search_text` | `lower(unaccent(title)) ⏎ lower(unaccent(author name))`, for accent-insensitive search (US-01) |

## Rules enforced by the database

- **Soft delete only:** there is no `delete` policy on `books`, `categories` or `authors` (US-16, US-17, US-18).
- **Roles:** `is_admin()` checks `profiles.role = 'ADMIN'` and `status = 'ACTIVE'`. Every insert and update on the catalogue requires it (US-13, layer 3).
- **Indexes:** `books_list_idx (created_at desc, id desc) where deleted_at is null` for the paginated list (US-20, NFR-3); `books_cat_idx`, `books_price_idx` for the filters (US-09).
- **Passwords:** stored only in `auth.users` as bcrypt hashes. No `public` table has a password column (US-10 B3, NFR-5).
