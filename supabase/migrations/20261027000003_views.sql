-- What customers may see (F3, F4, F5). security_invoker → RLS of the caller applies.
create view public.books_public with (security_invoker = true) as
select b.id, b.title, b.description, b.price, b.stock, b.cover_url, b.created_at,
       b.category_id, c.name as category_name,
       b.author_id,   a.name as author_name
from public.books b
join public.authors a    on a.id = b.author_id
join public.categories c on c.id = b.category_id
where b.deleted_at is null and a.is_hidden = false and c.is_hidden = false;

grant select on public.books_public to anon, authenticated;
