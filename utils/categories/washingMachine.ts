import {
  CalculationResult,
  Category,
  Eco_Activities_Row,
  HabitHandler,
  Metrics,
} from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';
import { storeEcoActivity } from '../store-eco-activity';

interface WashingMachineParsedInput {
  ecoMode: boolean;
  temperatureCelsius: 30 | 40 | 60 | 90;
}

type WashingMachineExtra = {
  mode: 'eco' | 'normal';
  temperatureCelsius: number;
  waterPerRunLiters: number;
  energyPerRunKwh: number;
  co2FactorKgPerKwh: number;
};

/**
 * Assumptions (average front-loader):
 * - Normal water usage: 50 L per run
 * - Eco mode reduces water by 30% and energy by 35%
 * - Energy by temperature (normal mode):
 *   30°C → 0.45 kWh, 40°C → 0.65 kWh, 60°C → 1.0 kWh, 90°C → 1.5 kWh
 * - CO₂ factor: 0.05 kg CO₂/kWh
 */
const NORMAL_WATER_LITERS = 50;
const ECO_WATER_MULTIPLIER = 0.7;
const ECO_ENERGY_MULTIPLIER = 0.65;
const CO2_KG_PER_KWH = 0.05;

const ENERGY_BY_TEMPERATURE: Record<30 | 40 | 60 | 90, number> = {
  30: 0.45,
  40: 0.65,
  60: 1.0,
  90: 1.5,
};

const VALID_TEMPERATURES = new Set([30, 40, 60, 90]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWashingMachineInput(value: unknown): value is WashingMachineParsedInput {
  if (!isObject(value)) return false;

  return (
    typeof value.ecoMode === 'boolean' &&
    typeof value.temperatureCelsius === 'number' &&
    VALID_TEMPERATURES.has(value.temperatureCelsius as number)
  );
}

function parseWashingMachineInput(raw: unknown): WashingMachineParsedInput {
  if (!isWashingMachineInput(raw)) {
    throw new InvalidPayloadError();
  }
  return raw;
}

async function calculateWashingMachineMetrics(
  data: WashingMachineParsedInput
): Promise<CalculationResult<WashingMachineExtra>> {
  const { ecoMode, temperatureCelsius } = data;

  const baseEnergyKwh = ENERGY_BY_TEMPERATURE[temperatureCelsius];
  const energyKwh = ecoMode ? baseEnergyKwh * ECO_ENERGY_MULTIPLIER : baseEnergyKwh;
  const waterLiters = ecoMode ? NORMAL_WATER_LITERS * ECO_WATER_MULTIPLIER : NORMAL_WATER_LITERS;
  const co2Kg = energyKwh * CO2_KG_PER_KWH;

  return {
    metrics: {
      co2_kg: Number(co2Kg.toFixed(3)),
      water_l: Number(waterLiters.toFixed(1)),
      energy_kwh: Number(energyKwh.toFixed(3)),
    },
    extra: {
      mode: ecoMode ? 'eco' : 'normal',
      temperatureCelsius,
      waterPerRunLiters: Number(waterLiters.toFixed(1)),
      energyPerRunKwh: Number(energyKwh.toFixed(3)),
      co2FactorKgPerKwh: CO2_KG_PER_KWH,
    },
  };
}

async function storeWashingMachineResult(args: {
  parsed: WashingMachineParsedInput;
  metrics: Metrics;
  extra: WashingMachineExtra;
  userId: string;
  supabase: import('@supabase/supabase-js/dist/index.mjs').SupabaseClient;
  category: Category;
  day: string;
}): Promise<Eco_Activities_Row> {
  const { userId, supabase, category, metrics, parsed, extra, day } = args;

  return storeEcoActivity({
    userId,
    supabase,
    category,
    metrics,
    day,
    details: {
      type: 'washingmachine',
      ecoMode: parsed.ecoMode,
      temperatureCelsius: parsed.temperatureCelsius,
      mode: extra.mode,
      waterPerRunLiters: extra.waterPerRunLiters,
      energyPerRunKwh: extra.energyPerRunKwh,
      co2FactorKgPerKwh: extra.co2FactorKgPerKwh,
    },
  });
}

export const washingMachineHandler: HabitHandler<
  WashingMachineParsedInput,
  WashingMachineExtra
> = {
  parse: parseWashingMachineInput,
  async calculate(parsed) {
    return calculateWashingMachineMetrics(parsed);
  },
  async store(args) {
    return storeWashingMachineResult(args);
  },
};