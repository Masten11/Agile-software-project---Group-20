this is how our database looks: 

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


