-- US-26 (CR-02, CCB 30/10/2026): one promotion per title – discount 1–90 %, start date, end date.
-- Dates are calendar days in Vietnam time; the promotion is active from start_date to end_date INCLUDED.
create table public.promotions (
  id                uuid primary key default gen_random_uuid(),
  book_id           uuid not null unique references public.books(id),
  discount_percent  integer not null check (discount_percent between 1 and 90),
  start_date        date not null,
  end_date          date not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint promotions_end_after_start check (end_date >= start_date)
);

create trigger promotions_updated_at before update on public.promotions
for each row execute function public.set_updated_at();

-- RLS: everyone may read promotions (the list and detail pages need them, US-27 / US-28);
-- only active admins may create, change or remove one.
alter table public.promotions enable row level security;
create policy "promotions: public read"   on public.promotions for select using (true);
create policy "promotions: admin insert"  on public.promotions for insert with check (public.is_admin());
create policy "promotions: admin update"  on public.promotions for update using (public.is_admin()) with check (public.is_admin());
create policy "promotions: admin delete"  on public.promotions for delete using (public.is_admin());

grant select on public.promotions to anon, authenticated;
