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
  created_at timestamptz not null default now(),
  eco_score INTEGER DEFAULT 500
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


drop table if exists public.eco_activities cascade;

CREATE TABLE public.eco_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  
  category    text not null, -- t.ex. 'transport', 'shower', 'dishawasher'

  co2_kg      numeric not null default 0,
  water_l     numeric not null default 0,
  energy_kwh  numeric not null default 0,

  details     jsonb default '{}'::jsonb, -- Här sparas from, to, item, etc.

  created_at  timestamptz not null default now(),       -- Exact timestamp when record was created
  day         date not null default current_date        -- The day the activity occurred (can be yesterday)
);

-- Aktivera RLS (Row Level Security)
ALTER TABLE public.eco_activities ENABLE ROW LEVEL SECURITY;


-- 2. Create the table to store the eco scores
DROP TABLE IF EXISTS public.eco_score_log CASCADE;

CREATE TABLE public.eco_score_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  timestamptz not null default now(),       -- Exact timestamp when record was created
    day         date not null default current_date,       -- The day the activity occurred (can be yesterday)
    score       INTEGER NOT NULL,
    UNIQUE(user_id, day)
);

-- Enable RLS
ALTER TABLE public.eco_score_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE public.eco_score_log ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their own score history" 
ON public.eco_score_log FOR SELECT 
USING (auth.uid() = user_id);


CREATE POLICY "Users can insert their own score history"
ON public.eco_score_log FOR INSERT
WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can delete their own score history"
ON public.eco_score_log FOR DELETE
USING (auth.uid() = user_id);


-- Skapa en policy så att användare bara kan se/ta bort sin egen data
CREATE POLICY "Users can manage their own eco_activities" 
ON public.eco_activities 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own score history"
ON public.eco_score_log 
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


//  Triggers

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, username, eco_score, created_at)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'username',
    500,
    now()
  );

  insert into public.eco_score_log (user_id, created_at, day, score)
  values (new.id, now(), CURRENT_DATE, 500);
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();




//Views and functions

-- ═════════════════════════════════════════════════════════
-- CO2 METRICS
-- ═════════════════════════════════════════════════════════

--  TOTALS  --

DROP VIEW IF EXISTS public.view_today_total_co2 CASCADE;
CREATE VIEW public.view_today_total_co2 WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(co2_kg) as total_co2
FROM public.eco_activities
WHERE day = current_date
GROUP BY user_id;

DROP VIEW IF EXISTS public.view_week_total_co2 CASCADE;
CREATE VIEW public.view_week_total_co2 WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(co2_kg) as total_co2
FROM public.eco_activities
WHERE day >= (current_date - interval '7 days')
GROUP BY user_id;

DROP VIEW IF EXISTS public.view_month_total_co2 CASCADE;
CREATE VIEW public.view_month_total_co2 WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(co2_kg) as total_co2
FROM public.eco_activities
WHERE date_trunc('month', day) = date_trunc('month', now())
GROUP BY user_id;

-- PER DAY (Last 7 days) --

DROP VIEW IF EXISTS public.view_weekly_per_day_co2 CASCADE;
CREATE VIEW public.view_weekly_per_day_co2 WITH (security_invoker = true) AS
SELECT
  user_id,
  day AS date,
  sum(co2_kg) AS total_co2
FROM public.eco_activities
WHERE day >= (current_date - interval '7 days')
GROUP BY user_id, day
ORDER BY day ASC;

-- PER WEEK (Current month) --

DROP VIEW IF EXISTS public.view_monthly_per_week_co2 CASCADE;
CREATE VIEW public.view_monthly_per_week_co2 WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('week', day)::date AS week_start,
  sum(co2_kg) AS total_co2
FROM public.eco_activities
WHERE date_trunc('month', day) = date_trunc('month', now())
GROUP BY user_id, week_start
ORDER BY week_start ASC;

-- CO2 MONTHLY PER YEAR --

DROP VIEW IF EXISTS public.view_yearly_per_month_co2 CASCADE;
CREATE VIEW public.view_yearly_per_month_co2 WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('month', day)::date AS month_start,
  to_char(date_trunc('month', day), 'Mon') as month_name,
  sum(co2_kg) AS total_co2
FROM public.eco_activities
WHERE EXTRACT(year FROM day) = EXTRACT(year FROM CURRENT_DATE)
GROUP BY user_id, month_start, month_name
ORDER BY month_start ASC;


-- ═════════════════════════════════════════════════════════
-- WATER METRICS
-- ═════════════════════════════════════════════════════════

-- TOTALS --

DROP VIEW IF EXISTS public.view_today_total_water CASCADE;
CREATE VIEW public.view_today_total_water WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(water_l) as total_water
FROM public.eco_activities
WHERE day = current_date
GROUP BY user_id;

DROP VIEW IF EXISTS public.view_week_total_water CASCADE;
CREATE VIEW public.view_week_total_water WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(water_l) as total_water
FROM public.eco_activities
WHERE day >= (current_date - interval '7 days')
GROUP BY user_id;

DROP VIEW IF EXISTS public.view_month_total_water CASCADE;
CREATE VIEW public.view_month_total_water WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(water_l) as total_water
FROM public.eco_activities
WHERE date_trunc('month', day) = date_trunc('month', now())
GROUP BY user_id;

-- PER DAY (Last 7 days) --
DROP VIEW IF EXISTS public.view_weekly_per_day_water CASCADE;
CREATE VIEW public.view_weekly_per_day_water WITH (security_invoker = true) AS
SELECT
  user_id,
  day AS date,
  sum(water_l) AS total_water
FROM public.eco_activities
WHERE day >= (current_date - interval '7 days')
GROUP BY user_id, day
ORDER BY day ASC;

-- PER WEEK (Current month) --
DROP VIEW IF EXISTS public.view_monthly_per_week_water CASCADE;
CREATE VIEW public.view_monthly_per_week_water WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('week', day)::date AS week_start,
  sum(water_l) AS total_water
FROM public.eco_activities
WHERE date_trunc('month', day) = date_trunc('month', now())
GROUP BY user_id, week_start
ORDER BY week_start ASC;


-- WATER MONTHLY PER YEAR --

DROP VIEW IF EXISTS public.view_yearly_per_month_water CASCADE;
CREATE VIEW public.view_yearly_per_month_water WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('month', day)::date AS month_start,
  to_char(date_trunc('month', day), 'Mon') as month_name,
  sum(water_l) AS total_water
FROM public.eco_activities
WHERE EXTRACT(year FROM day) = EXTRACT(year FROM CURRENT_DATE)
GROUP BY user_id, month_start, month_name
ORDER BY month_start ASC;


-- ═════════════════════════════════════════════════════════
-- ELECTRICITY METRICS
-- ═════════════════════════════════════════════════════════

-- TOTALS -- 
DROP VIEW IF EXISTS public.view_today_total_electricity CASCADE;
CREATE VIEW public.view_today_total_electricity WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(energy_kwh) as total_electricity
FROM public.eco_activities
WHERE day = current_date
GROUP BY user_id;

DROP VIEW IF EXISTS public.view_week_total_electricity CASCADE;
CREATE VIEW public.view_week_total_electricity WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(energy_kwh) as total_electricity
FROM public.eco_activities
WHERE day >= (current_date - interval '7 days')
GROUP BY user_id;

DROP VIEW IF EXISTS public.view_month_total_electricity CASCADE;
CREATE VIEW public.view_month_total_electricity WITH (security_invoker = true) AS
SELECT 
  user_id,
  sum(energy_kwh) as total_electricity
FROM public.eco_activities
WHERE date_trunc('month', day) = date_trunc('month', now())
GROUP BY user_id;

-- PER DAY (Last 7 days) --

DROP VIEW IF EXISTS public.view_weekly_per_day_electricity CASCADE;
CREATE VIEW public.view_weekly_per_day_electricity WITH (security_invoker = true) AS
SELECT
  user_id,
  day AS date,
  sum(energy_kwh) AS total_electricity
FROM public.eco_activities
WHERE day >= (current_date - interval '7 days')
GROUP BY user_id, day
ORDER BY day ASC;

-- PER WEEK (Current month) --
DROP VIEW IF EXISTS public.view_monthly_per_week_electricity CASCADE;
CREATE VIEW public.view_monthly_per_week_electricity WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('week', day)::date AS week_start,
  sum(energy_kwh) AS total_electricity
FROM public.eco_activities
WHERE date_trunc('month', day) = date_trunc('month', now())
GROUP BY user_id, week_start
ORDER BY week_start ASC;


-- ELECTRICITY MONTHLY PER YEAR -- 

DROP VIEW IF EXISTS public.view_yearly_per_month_electricity CASCADE;
CREATE VIEW public.view_yearly_per_month_electricity WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('month', day)::date AS month_start,
  to_char(date_trunc('month', day), 'Mon') as month_name,
  sum(energy_kwh) AS total_electricity
FROM public.eco_activities
WHERE EXTRACT(year FROM day) = EXTRACT(year FROM CURRENT_DATE)
GROUP BY user_id, month_start, month_name
ORDER BY month_start ASC;


-- ═════════════════════════════════════════════════════════
-- HABITS VIEWS
-- ═════════════════════════════════════════════════════════

-- Today --

DROP VIEW IF EXISTS public.view_today_habits CASCADE;
CREATE VIEW public.view_today_habits WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  category,
  co2_kg,
  water_l,
  energy_kwh,
  details,
  day,
  created_at
FROM public.eco_activities
WHERE day = current_date
ORDER BY created_at DESC;

-- Yesterday --

DROP VIEW IF EXISTS public.view_yesterday_habits CASCADE;
CREATE VIEW public.view_yesterday_habits WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  category,
  co2_kg,
  water_l,
  energy_kwh,
  details,
  day,
  created_at
FROM public.eco_activities
WHERE day = current_date - interval '1 day'
ORDER BY created_at DESC;




-- ═════════════════════════════════════════════════════════
-- Leaderboard view
-- ═════════════════════════════════════════════════════════

-- Recreate the view using an INNER JOIN
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  p.id AS user_id,
  p.username,
  p.avatar_gradient,
  p.eco_score,
  COALESCE(SUM(ea.co2_kg), 0) AS total_co2_kg,
  COALESCE(SUM(ea.water_l), 0) AS total_water_l,
  COALESCE(SUM(ea.energy_kwh), 0) AS total_energy_kwh
FROM public.profiles p
-- Using INNER JOIN (just 'JOIN') guarantees only users with >= 1 activity are included
JOIN public.eco_activities ea ON p.id = ea.user_id
GROUP BY p.id, p.username, p.avatar_gradient, p.eco_score
ORDER BY p.eco_score DESC;

-- Make sure authenticated users can still read it
GRANT SELECT ON public.leaderboard_view TO authenticated;



