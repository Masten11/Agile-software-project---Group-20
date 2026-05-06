import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import { CalculationResult, Category, EmissionRow, HabitHandler, Metrics, TransportationInput, TransportMode } from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';

const CO2_FACTORS: Record<TransportMode, number> = {
  car: 0.12,
  bus: 0.03,
  train: 0.01,
  bike: 0.0,
  plane: 0.25,
};

interface TransportationParsedInput {
  start: string;
  destination: string;
  transportMode: TransportMode;
}

type TransportationExtra = {
  distanceInKm: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTransportationInput(value: unknown): value is TransportationInput {
  if (!isObject(value)) {
    return false;
  }

  const validModes = new Set(['car', 'bus', 'train', 'plane', 'bike']);
  return (
    typeof value.start === 'string' &&
    typeof value.destination === 'string' &&
    typeof value.transportMode === 'string' &&
    validModes.has(value.transportMode)
  );
}

function parseTransportationInput(raw: unknown): TransportationParsedInput {
  if (!isTransportationInput(raw)) {
    throw new InvalidPayloadError();
  }

  return raw;
}

async function calculateTransportationMetrics(
  data: TransportationParsedInput
): Promise<CalculationResult<TransportationExtra>> {
  const { start, destination, transportMode } = data;

  // Gör om meter till kilometer
  const distanceInKm = await getDistance(start, destination);

  // Beräkna CO2
  const co2Emissions = distanceInKm * CO2_FACTORS[transportMode];

  return {
    metrics: {
      co2_kg: co2Emissions,
      water_l: 0,
      energy_kwh: 0,
    },
    extra: {
      distanceInKm,
    },
  };
}

async function storeTransportationResult(args: {
  parsed: TransportationParsedInput;
  metrics: Metrics;
  extra: TransportationExtra;
  userId: string;
  supabase: SupabaseClient;
  category: Category;
}): Promise<EmissionRow> {
  const { userId, supabase, category, metrics, parsed, extra } = args;

  const { data: savedData, error } = await supabase
    .from('emissions')
    .insert([
      {
        user_id: userId,
        category: category,
        co2_kg: metrics.co2_kg,
        water_l: metrics.water_l,
        energy_kwh: metrics.energy_kwh,
        details: {
          ...parsed,
          distanceInKm: extra.distanceInKm,
        },
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return savedData;
}

export const transportationHandler: HabitHandler<TransportationParsedInput, TransportationExtra> = {
  parse: parseTransportationInput,
  async calculate(parsed) {
    return calculateTransportationMetrics(parsed);
  },
  async store(args) {
    return storeTransportationResult(args);
  },
};


//Helper function to get the distance between two places using Google Maps API
async function getDistance(start: string, destination: string): Promise<number> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error("Google Maps API-key is missning");
  }

  // Vi anropar Google Maps Distance Matrix API
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(start)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const element = data.rows[0].elements[0];

  if (element.status !== "OK") {
    throw new Error(`Could not calculate distance: ${element.status}.`);
  }

  // Avståndet kommer i meter, så vi delar med 1000 för att få kilometer
  const distanceInKm = element.distance.value / 1000;
  return distanceInKm;
}