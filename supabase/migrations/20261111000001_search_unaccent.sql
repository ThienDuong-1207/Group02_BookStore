-- US-01 (GB-6) AC1: search by title or author, case- AND accent-insensitive ("nguyen" finds "Nguyễn").
-- Adds a `search_text` column to `books_public`: title and author name, lower-cased and without Vietnamese marks,
-- joined by a newline so a keyword can never match across the title/author boundary (the search box is one line).
-- The app folds the keyword the same way (src/lib/books/search.ts) and filters with `ilike '%keyword%'`.

-- Supabase keeps extensions in the `extensions` schema (already granted to anon / authenticated).
create extension if not exists unaccent with schema extensions;

-- `create or replace view` may only ADD columns at the end, so every existing column stays in the same order.
-- The dictionary is named explicitly: the one-argument unaccent() looks it up through search_path, which can
-- differ for the API roles.
create or replace view public.books_public with (security_invoker = true) as
select b.id, b.title, b.description, b.price, b.stock, b.cover_url, b.created_at,
       b.category_id, c.name as category_name,
       b.author_id,   a.name as author_name,
       lower(extensions.unaccent('extensions.unaccent'::regdictionary, b.title))
         || chr(10) ||
       lower(extensions.unaccent('extensions.unaccent'::regdictionary, a.name)) as search_text
from public.books b
join public.authors a    on a.id = b.author_id
join public.categories c on c.id = b.category_id
where b.deleted_at is null and a.is_hidden = false and c.is_hidden = false;

grant select on public.books_public to anon, authenticated;
