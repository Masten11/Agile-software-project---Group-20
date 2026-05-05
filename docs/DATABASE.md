//Schema (Tables + RLS)

-- ─────────────────────────────────────────
-- Drop everything
-- ─────────────────────────────────────────

drop table if exists public.profiles cascade;


-- ─────────────────────────────────────────
-- 0. Profiles
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  username text unique,
  avatar_gradient text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


drop table if exists public.emissions cascade;

CREATE TABLE public.emissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  
  category    text not null, -- t.ex. 'transport', 'water', 'energy'

  co2_kg      numeric not null default 0,
  water_l     numeric not null default 0,
  energy_kwh  numeric not null default 0,

  details     jsonb default '{}'::jsonb, -- Här sparas from, to, item, etc.
  created_at  timestamptz not null default now()
);

-- Aktivera RLS (Row Level Security)
ALTER TABLE public.emissions ENABLE ROW LEVEL SECURITY;

-- Skapa en policy så att användare bara kan se/ta bort sin egen data
CREATE POLICY "Users can manage their own emissions" 
ON public.emissions 
FOR ALL 
USING (auth.uid() = user_id);


//  Triggers

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, username, created_at)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'username',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


//Views and functions

-- ═════════════════════════════════════════════════════════
-- TODAY'S TOTAL
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_today_total CASCADE;
CREATE VIEW public.view_today_total WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(co2_kg) as total_co2,
  sum(water_l) as total_water,
  sum(energy_kwh) as total_energy
FROM public.emissions
WHERE date_trunc('day', created_at) = current_date
GROUP BY user_id;


-- ═════════════════════════════════════════════════════════
-- YESTERDAY'S TOTAL
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_yesterday_total CASCADE;
CREATE VIEW public.view_yesterday_total WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(co2_kg) as total_co2,
  sum(water_l) as total_water,
  sum(energy_kwh) as total_energy
FROM public.emissions
WHERE created_at >= current_date - interval '1 day'
  AND created_at < current_date
GROUP BY user_id;


-- ═════════════════════════════════════════════════════════
-- WEEKLY STATS (Last 7 days breakdown by day)
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_weekly_stats CASCADE;
CREATE VIEW public.view_weekly_stats WITH (security_invoker = true) AS
SELECT 
  user_id,
  date_trunc('day', created_at)::date as date,
  to_char(date_trunc('day', created_at), 'Dy') as day_name,
  sum(co2_kg) as total_co2,
  sum(water_l) as total_water,
  sum(energy_kwh) as total_energy
FROM public.emissions
WHERE created_at >= (now() - interval '7 days')
GROUP BY user_id, date, day_name
ORDER BY date DESC;


-- ═════════════════════════════════════════════════════════
-- MONTHLY STATS (Grouped by week)
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_monthly_stats CASCADE;
CREATE VIEW public.view_monthly_stats WITH (security_invoker = true) AS
SELECT 
  user_id,
  date_trunc('week', created_at)::date as week_start,
  sum(co2_kg) as total_co2,
  sum(water_l) as total_water,
  sum(energy_kwh) as total_energy
FROM public.emissions
WHERE created_at >= date_trunc('month', now())
GROUP BY user_id, week_start
ORDER BY week_start ASC;


-- ═════════════════════════════════════════════════════════
-- TODAY'S DETAILED VIEW
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_today_details CASCADE;
CREATE VIEW public.view_today_details WITH (security_invoker = true) AS
SELECT 
  user_id,
  category,
  co2_kg,
  water_l,
  energy_kwh,
  details,
  created_at
FROM public.emissions
WHERE date_trunc('day', created_at) = current_date
ORDER BY created_at DESC;


-- ═════════════════════════════════════════════════════════
-- ALL TIME STATS
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_all_time_stats CASCADE;
CREATE VIEW public.view_all_time_stats WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(co2_kg) as total_co2,
  sum(water_l) as total_water,
  sum(energy_kwh) as total_energy,
  count(*) as total_activities,
  min(created_at) as first_activity,
  max(created_at) as last_activity
FROM public.emissions
GROUP BY user_id;


-- ═════════════════════════════════════════════════════════
-- BY CATEGORY (Today)
-- ═════════════════════════════════════════════════════════
DROP VIEW IF EXISTS public.view_today_by_category CASCADE;
CREATE VIEW public.view_today_by_category WITH (security_invoker = true) AS
SELECT 
  user_id,
  category,
  sum(co2_kg) as total_co2,
  sum(water_l) as total_water,
  sum(energy_kwh) as total_energy,
  count(*) as activity_count
FROM public.emissions
WHERE date_trunc('day', created_at) = current_date
GROUP BY user_id, category
ORDER BY category ASC;