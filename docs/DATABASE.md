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


drop table if exists public.eco_activities cascade;

CREATE TABLE public.eco_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  
  category    text not null, -- t.ex. 'transport', 'water', 'energy'

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
DROP TABLE IF EXISTS public.daily_eco_scores CASCADE;

CREATE TABLE public.eco_score_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.eco_activities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    score INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE public.eco_score_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own score history" 
ON public.eco_score_log FOR SELECT 
USING (auth.uid() = user_id);

-- Skapa en policy så att användare bara kan se/ta bort sin egen data
CREATE POLICY "Users can manage their own eco_activities" 
ON public.eco_activities 
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



CREATE OR REPLACE FUNCTION rebuild_user_eco_score_log()
RETURNS TRIGGER AS $$
DECLARE
    target_user UUID;
    running_score INTEGER := 500;
    
    act RECORD;
    current_day DATE := NULL;
    dishwasher_count INTEGER := 0;
    
    net_change INTEGER := 0;
    bonus INTEGER := 0;
    penalty INTEGER := 0;
    t_mode TEXT;
    shower_mins NUMERIC;
BEGIN
    -- 1. Identify User
    IF TG_OP = 'DELETE' THEN
        target_user := OLD.user_id;
    ELSE
        target_user := NEW.user_id;
    END IF;

    -- 2. Clear the existing history for this user to prevent duplicates
    DELETE FROM public.eco_score_log WHERE user_id = target_user;

    -- 3. Loop through all user activities in chronological order
    FOR act IN 
        SELECT id, category, details, co2_kg, water_l, energy_kwh, day, created_at
        FROM public.eco_activities 
        WHERE user_id = target_user 
        ORDER BY created_at ASC
    LOOP
        bonus := 0;
        penalty := 0;

        -- Reset daily counters (like dishwasher uses) if the day changes
        IF current_day IS NULL OR current_day != act.day THEN
            current_day := act.day;
            dishwasher_count := 0;
        END IF;

        -- 🚿 SHOWER RULES
        IF act.category = 'shower' AND act.details ? 'minutes' THEN
            shower_mins := (act.details->>'minutes')::numeric;
            IF shower_mins <= 3 THEN bonus := 10;     
            ELSIF shower_mins <= 5 THEN penalty := 5; 
            ELSIF shower_mins >= 15 THEN penalty := 20; 
            END IF;
        END IF;

        --  DISHWASHER RULES
        IF act.category = 'dishwasher' THEN
            dishwasher_count := dishwasher_count + 1;
            IF act.details ? 'ecoMode' AND (act.details->>'ecoMode') = 'true' THEN
                bonus := 5;
            END IF;
            
            -- Apply a massive penalty on the 3rd use of the same day
            IF dishwasher_count > 2 THEN
                penalty := penalty + (dishwasher_count-2)*5;
            END IF;
        END IF;

        --  TRANSPORT RULES
        IF act.category = 'transport' AND act.details ? 'transportMode' THEN
            t_mode := act.details->>'transportMode';
            IF t_mode = 'bike' THEN bonus := 5;     
            ELSIF t_mode = 'train' OR t_mode = 'bus' THEN bonus := 5;     
            ELSIF t_mode = 'plane' THEN penalty := 200; 
            ELSIF t_mode = 'car' THEN
                IF act.details ? 'distance_km' THEN
                    IF (act.details->>'distance_km')::numeric < 2 THEN
                        penalty := 30;
                    ELSE 
                        penalty := ROUND((act.details->>'distance_km')::numeric * 0.5);
                    END IF;
                END IF;
            END IF;
        END IF;

        -- 4. Calculate Net Change for this specific activity
        net_change := 
            bonus 
            - penalty 
            - ROUND((COALESCE(act.co2_kg, 0) * 5) + (COALESCE(act.water_l, 0) * 0.1) + (COALESCE(act.energy_kwh, 0) * 2));

        -- 5. Apply change and clamp to 0-1000
        running_score := running_score + net_change;
        IF running_score > 1000 THEN running_score := 1000; END IF;
        IF running_score < 0 THEN running_score := 0; END IF;

        -- 6. Insert this snapshot into the timeline log
        INSERT INTO public.eco_score_log (user_id, activity_id, created_at, score)
        VALUES (target_user, act.id, act.created_at, running_score);

    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to eco_activities
DROP TRIGGER IF EXISTS update_eco_score_trigger ON public.eco_activities;
CREATE TRIGGER update_eco_score_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.eco_activities
FOR EACH ROW EXECUTE FUNCTION rebuild_user_eco_score_log();


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