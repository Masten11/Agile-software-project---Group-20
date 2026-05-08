import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';

export enum Category {
  Transportation = 'transport',
  Water = 'water',
  Energy = 'energy',
}

export type LogHabitRequest = {
  category: Category;
  body: unknown;
};

// Type for the emission row in the database
export type EmissionRow = {
  id: string;
  user_id: string;
  category: string;
  co2_kg: number;
  water_l: number;
  energy_kwh: number;
  details: Record<string, unknown>;
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

export interface HabitHandler<Parsed, TExtra> {
  parse: (raw: unknown) => Parsed;
  calculate: (parsed: Parsed) => Promise<CalculationResult<TExtra>>;
  store: (args: {
    parsed: Parsed;
    metrics: Metrics;
    extra: TExtra;
    userId: string;
    supabase: SupabaseClient;
    category: Category;
    date?: string; // <--- HÄR ÄR FIXEN! Nu stämmer kontraktet överens med logiken.
  }) => Promise<Eco_Activities_Row>;
}

/////////////////////////////
/// Input types for log-habit endpoint
/////////////////////////////

export type TransportMode = 'car' | 'bus' | 'train' | 'plane' | 'bike';

export interface TransportationInput {
  start: string;
  destination: string;
  transportMode: TransportMode;
}

export interface ShowerInput {
  type: 'shower';
  minutes: number;
}

export interface DishwasherInput {
  type: 'dishwasher';
  ecoMode: boolean;
}

export type WaterInput = ShowerInput | DishwasherInput;

/////////////////////////////
/// Input types for unlog-habit endpoint
/////////////////////////////

export type UnlogHabitRequest = {
  id: string;
};