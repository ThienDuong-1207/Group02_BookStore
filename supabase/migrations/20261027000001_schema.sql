-- Release 1.0 schema (PROJECT_SPEC.md §5). Task WBS 1.3.1.
create type public.user_role      as enum ('ADMIN', 'CUSTOMER');
create type public.account_status as enum ('ACTIVE', 'LOCKED');

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
  is_hidden   boolean not null default false,
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
  price        integer not null check (price > 0),
  stock        integer not null default 0 check (stock >= 0),
  cover_url    text,
  author_id    uuid not null references public.authors(id),
  category_id  uuid not null references public.categories(id),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index books_list_idx  on public.books (created_at desc, id desc) where deleted_at is null;
create index books_cat_idx   on public.books (category_id);
create index books_price_idx on public.books (price);

-- keep updated_at current
create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger books_updated_at    before update on public.books    for each row execute function public.set_updated_at();

-- create a profile automatically when a user signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          nullif(new.raw_user_meta_data->>'phone', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- helper for RLS
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'ADMIN' and status = 'ACTIVE');
$$;
