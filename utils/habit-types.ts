import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';

export enum Category {
  Transportation = 'transport', //Add more categories here
  Shower = 'shower',
  Dishwasher = 'dishwasher',
  WashingMachine = 'washingmachine',
}

export type DayOffset = 0 | 1;

export type LogHabitRequest = {
  category: Category;
  dayOffset: DayOffset;
  body: unknown;
};


//Type for the emission row in the database
export type Eco_Activities_Row = {
  id: string;
  user_id: string;
  category: string;
  co2_kg: number;
  water_l: number;
  energy_kwh: number;
  details: Record<string, unknown>;
  day: string;
  created_at: string;
};

export type Metrics = {
  co2_kg: number;
  water_l: number;
  energy_kwh: number;
};

export type CalculationResult<T> = {
  metrics: Metrics;
  extra: T;
};

export type StoreHabitArgs<Parsed, TExtra> = {
  parsed: Parsed;
  metrics: Metrics;
  extra: TExtra;
  userId: string;
  supabase: SupabaseClient;
  category: Category;
  day: string;
};

export interface HabitHandler<Parsed, TExtra> {
  parse: (raw: unknown) => Parsed;
  calculate: (parsed: Parsed) => Promise<CalculationResult<TExtra>>;
  store: (args: StoreHabitArgs<Parsed, TExtra>) => Promise<Eco_Activities_Row>;
}

/////////////////////////////
/// Input types for log-habit endpoint
////////////////////////////7

export type TransportMode = 'car' | 'bus' | 'train' | 'plane' | 'bike';

export interface TransportationInput {
  start: string;
  destination: string;
  transportMode: TransportMode; // Begränsa till giltiga val
}

/////////////////////////////
/// Input types for unlog-habit endpoint
////////////////////////////7
export type UnlogHabitRequest = {
  id: string;
};