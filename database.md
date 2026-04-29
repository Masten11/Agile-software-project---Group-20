-- ─────────────────────────────────────────
-- Drop everything
-- ─────────────────────────────────────────
drop table if exists public.transport_logs cascade;
drop table if exists public.eco_activities cascade;
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

CREATE TABLE public.emissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category    text not null, -- t.ex. 'transport', 'food', 'energy'
  co2_kg      numeric not null,
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


//views and functions


DROP VIEW IF EXISTS view_monthly_stats;

CREATE VIEW view_monthly_stats WITH (security_invoker = true) AS
SELECT 
  date_trunc('week', created_at) as week_start,
  sum(co2_kg) as total_co2,
  user_id
FROM public.emissions
WHERE created_at >= date_trunc('month', now()) -- Hämtar från början av innevarande månad
GROUP BY week_start, user_id
ORDER BY week_start ASC;


DROP VIEW IF EXISTS view_today_total;

CREATE VIEW view_today_total WITH (security_invoker = true) AS
SELECT 
  sum(co2_kg) as total_today,
  user_id
FROM public.emissions
WHERE created_at >= current_date
GROUP BY user_id;


DROP VIEW IF EXISTS view_weekly_stats;

CREATE VIEW view_weekly_stats WITH (security_invoker = true) AS
SELECT 
  date_trunc('day', created_at) as date,
  to_char(date_trunc('day', created_at), 'Dy') as day_name, -- Ger 'Mon', 'Tue', osv.
  sum(co2_kg) as total_co2,
  user_id
FROM public.emissions
WHERE created_at >= (now() - interval '7 days')
GROUP BY date, user_id
ORDER BY date ASC;