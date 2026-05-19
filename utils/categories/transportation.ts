import { CalculationResult, HabitHandler, StoreHabitArgs, TransportationInput, TransportMode } from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';
import { storeEcoActivity } from '../store-eco-activity';

const CO2_FACTORS: Record<TransportMode, number> = {
  car: 0.16,           // kg/km. WTW (Well-to-Wheel) för svensk genomsnittlig fossilbil.
  bus: 0.02,           // kg/km per passagerare. Hög andel HVO/biogas i svensk kollektivtrafik.
  train: 0.001,        // kg/km per passagerare. Svenska tåg (ex. SJ) körs på 100% förnybar el.
  bike: 0.0,
  plane: 0.25,         // kg/km per passagerare. Flygbränsle (WTW) för inrikes/Europaflyg.
  walking: 0.0,
  electric_car: 0.005, // kg/km. 0.2 kWh/km * ~15-20g CO2e/kWh (Svensk genomsnittlig elmix).
  electric_bus: 0.002, // kg/km per passagerare. Elbuss delat på snittbeläggning.
};

const ENERGY_FACTORS: Record<TransportMode, number> = {
  car: 0.6,            // kWh/km. Termiskt energivärde för bränslet (ca 0.6 liter/milen).
  bus: 0.15,           // kWh/km per passagerare. Diesel/biogas omräknat till energi.
  train: 0.08,         // kWh/km per passagerare. Mycket energieffektiv rälsdrift.
  bike: 0.0,
  plane: 0.45,         // kWh/km per passagerare. Extremt hög energiåtgång per km.
  walking: 0.0,
  electric_car: 0.2,   // kWh/km. Genomsnittlig förbrukning för elbil.
  electric_bus: 0.1,   // kWh/km per passagerare.
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

  const validModes = new Set(['car', 'bus', 'train', 'plane', 'bike', 'electric_car', "electric_bus", 'walking']);
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
      energy_kwh: distanceInKm * ENERGY_FACTORS[transportMode],
    },
    extra: {
      distanceInKm,
    },
  };
}

async function storeTransportationResult(
  args: StoreHabitArgs<TransportationParsedInput, TransportationExtra>
) {
  const { userId, supabase, category, metrics, parsed, extra, day } = args;

  return storeEcoActivity({
    userId,
    supabase,
    category,
    metrics,
    day,
    details: {
      ...parsed,
      distanceInKm: extra.distanceInKm,
    },
  });
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