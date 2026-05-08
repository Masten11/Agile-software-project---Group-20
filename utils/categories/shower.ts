import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import {
  CalculationResult,
  Category,
  Eco_Activities_Row,
  HabitHandler,
  Metrics,
} from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';


interface ShowerParsedInput {
  minutes: number;
}


type ShowerExtra = {
  litersPerMinute: number;
  totalWaterLiters: number;
  energyPerLiterKwh: number;
  co2FactorKgPerKwh: number;
};


/**
 * Assumptions:
 * - Average shower flow: 9 liters/minute
 * - Heating 1 liter of water by about 30°C takes roughly 0.0349 kWh
 * - CO₂ factor: 0.05 kg CO₂/kWh
 */
const SHOWER_LITERS_PER_MINUTE = 9;
const ENERGY_KWH_PER_LITER = 0.0349;
const CO2_KG_PER_KWH = 0.05;


function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}


function isShowerInput(value: unknown): value is ShowerParsedInput {
  if (!isObject(value)) {
    return false;
  }


  return (
    typeof value.minutes === 'number' &&
    Number.isFinite(value.minutes) &&
    value.minutes > 0
  );
}


function parseShowerInput(raw: unknown): ShowerParsedInput {
  if (!isShowerInput(raw)) {
    throw new InvalidPayloadError();
  }


  return raw;
}


async function calculateShowerMetrics(
  data: ShowerParsedInput
): Promise<CalculationResult<ShowerExtra>> {
  const { minutes } = data;


  const waterLiters = minutes * SHOWER_LITERS_PER_MINUTE;
  const energyKwh = waterLiters * ENERGY_KWH_PER_LITER;
  const co2Kg = energyKwh * CO2_KG_PER_KWH;


  return {
    metrics: {
      co2_kg: Number(co2Kg.toFixed(3)),
      water_l: Number(waterLiters.toFixed(1)),
      energy_kwh: Number(energyKwh.toFixed(3)),
    },
    extra: {
      litersPerMinute: SHOWER_LITERS_PER_MINUTE,
      totalWaterLiters: Number(waterLiters.toFixed(1)),
      energyPerLiterKwh: ENERGY_KWH_PER_LITER,
      co2FactorKgPerKwh: CO2_KG_PER_KWH,
    },
  };
}


async function storeShowerResult(args: {
  parsed: ShowerParsedInput;
  metrics: Metrics;
  extra: ShowerExtra;
  userId: string;
  supabase: SupabaseClient;
  category: Category;
  date?: string;
}): Promise<Eco_Activities_Row> {
  const { userId, supabase, category, metrics, parsed, extra, date } = args;


  const { data: savedData, error } = await supabase
    .from('eco_activities')
    .insert([
      {
        user_id: userId,
        category,
        co2_kg: metrics.co2_kg,
        water_l: metrics.water_l,
        energy_kwh: metrics.energy_kwh,
        activity_date: date,
        details: {
          type: 'shower',
          minutes: parsed.minutes,
          litersPerMinute: extra.litersPerMinute,
          totalWaterLiters: extra.totalWaterLiters,
          energyPerLiterKwh: extra.energyPerLiterKwh,
          co2FactorKgPerKwh: extra.co2FactorKgPerKwh,
        },
      },
    ])
    .select()
    .single();


  if (error) throw new Error(error.message);


  return savedData;
}


export const showerHandler: HabitHandler<ShowerParsedInput, ShowerExtra> = {
  parse: parseShowerInput,
  async calculate(parsed) {
    return calculateShowerMetrics(parsed);
  },
  async store(args) {
    return storeShowerResult(args);
  },
};
