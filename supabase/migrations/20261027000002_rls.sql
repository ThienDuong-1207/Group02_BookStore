-- Row Level Security (PROJECT_SPEC.md §5). No DELETE policy on books: soft delete only.
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.authors    enable row level security;
alter table public.books      enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
create policy "profiles: admin read all" on public.profiles for select using (public.is_admin());
create policy "profiles: admin update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
-- users may edit their own name/phone only (role/status are protected by the trigger below)
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role'
     and (new.role is distinct from old.role or new.status is distinct from old.status or new.email is distinct from old.email) then
    raise exception 'Only administrators can change role, status or email';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_columns();

-- categories & authors
create policy "categories: public read visible" on public.categories for select using (is_hidden = false or public.is_admin());
create policy "categories: admin insert" on public.categories for insert with check (public.is_admin());
create policy "categories: admin update" on public.categories for update using (public.is_admin()) with check (public.is_admin());

create policy "authors: public read visible" on public.authors for select using (is_hidden = false or public.is_admin());
create policy "authors: admin insert" on public.authors for insert with check (public.is_admin());
create policy "authors: admin update" on public.authors for update using (public.is_admin()) with check (public.is_admin());

-- books
create policy "books: public read not deleted" on public.books for select using (deleted_at is null or public.is_admin());
create policy "books: admin insert" on public.books for insert with check (public.is_admin());
create policy "books: admin update" on public.books for update using (public.is_admin()) with check (public.is_admin());

-- storage bucket for covers: public read, admin write
insert into storage.buckets (id, name, public) values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;
create policy "covers: public read" on storage.objects for select using (bucket_id = 'book-covers');
create policy "covers: admin insert" on storage.objects for insert with check (bucket_id = 'book-covers' and public.is_admin());
create policy "covers: admin update" on storage.objects for update using (bucket_id = 'book-covers' and public.is_admin());
create policy "covers: admin delete" on storage.objects for delete using (bucket_id = 'book-covers' and public.is_admin());
