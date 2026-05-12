import {
  CalculationResult,
  HabitHandler,
  StoreHabitArgs,
} from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';
import { storeEcoActivity } from '../store-eco-activity';


interface DishwasherParsedInput {
  ecoMode: boolean;
}


type DishwasherExtra = {
  mode: 'eco' | 'normal';
  waterPerRunLiters: number;
  energyPerRunKwh: number;
  co2FactorKgPerKwh: number;
};


/**
 * Assumptions:
 * - Normal dishwasher run: 15 L water, 1.2 kWh
 * - Eco dishwasher run: 10 L water, 0.8 kWh
 * - CO₂ factor: 0.05 kg CO₂/kWh
 */
const NORMAL_WATER_LITERS = 15;
const NORMAL_ENERGY_KWH = 1.2;


const ECO_WATER_LITERS = 10;
const ECO_ENERGY_KWH = 0.8;


const CO2_KG_PER_KWH = 0.05;


function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}


function isDishwasherInput(value: unknown): value is DishwasherParsedInput {
  if (!isObject(value)) {
    return false;
  }


  return typeof value.ecoMode === 'boolean';
}


function parseDishwasherInput(raw: unknown): DishwasherParsedInput {
  if (!isDishwasherInput(raw)) {
    throw new InvalidPayloadError();
  }


  return raw;
}


async function calculateDishwasherMetrics(
  data: DishwasherParsedInput
): Promise<CalculationResult<DishwasherExtra>> {
  const { ecoMode } = data;


  const waterLiters = ecoMode ? ECO_WATER_LITERS : NORMAL_WATER_LITERS;
  const energyKwh = ecoMode ? ECO_ENERGY_KWH : NORMAL_ENERGY_KWH;
  const co2Kg = energyKwh * CO2_KG_PER_KWH;


  return {
    metrics: {
      co2_kg: Number(co2Kg.toFixed(3)),
      water_l: Number(waterLiters.toFixed(1)),
      energy_kwh: Number(energyKwh.toFixed(3)),
    },
    extra: {
      mode: ecoMode ? 'eco' : 'normal',
      waterPerRunLiters: waterLiters,
      energyPerRunKwh: energyKwh,
      co2FactorKgPerKwh: CO2_KG_PER_KWH,
    },
  };
}


async function storeDishwasherResult(
  args: StoreHabitArgs<DishwasherParsedInput, DishwasherExtra>
) {
  const { userId, supabase, category, metrics, parsed, extra, day } = args;

  return storeEcoActivity({
    userId,
    supabase,
    category,
    metrics,
    day,
    details: {
      ecoMode: parsed.ecoMode,
      mode: extra.mode,
      waterPerRunLiters: extra.waterPerRunLiters,
      energyPerRunKwh: extra.energyPerRunKwh,
      co2FactorKgPerKwh: extra.co2FactorKgPerKwh,
    },
  });
}


export const dishwasherHandler: HabitHandler<
  DishwasherParsedInput,
  DishwasherExtra
> = {
  parse: parseDishwasherInput,
  async calculate(parsed) {
    return calculateDishwasherMetrics(parsed);
  },
  async store(args) {
    return storeDishwasherResult(args);
  },
};
