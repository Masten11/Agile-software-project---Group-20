import { SupabaseClient } from '@supabase/supabase-js';
import { TransportationInput, TransportMode } from './types';
import { getDistance } from './googleMaps';

const CO2_FACTORS: Record<TransportMode, number> = {
  car: 0.12,
  bus: 0.03,
  train: 0.01,
  bike: 0.0,
  plane: 0.25,
};

interface TransportationCalculationResult {
  start: string;
  destination: string;
  transportMode: TransportMode;
  distanceInKm: number;
  co2Emissions: number;
}

export async function calculateTransportationCO2(
  data: TransportationInput
): Promise<TransportationCalculationResult> {
  const { start, destination, transportMode } = data;

  // Gör om meter till kilometer
  const distanceInKm = await getDistance(start, destination);

  // Beräkna CO2
  const co2Emissions = distanceInKm * CO2_FACTORS[transportMode];

  return {
    start,
    destination,
    transportMode,
    distanceInKm,
    co2Emissions,
  };
}

export async function storeTransportationResult(
  data: TransportationCalculationResult & { userId: string },
  supabase: SupabaseClient
) {
  const { start, destination, transportMode, co2Emissions, userId } = data;

  // 1. Bygg en snygg summary som frontenden kan visa direkt (t.ex. "Bus from Gothenburg to Stockholm")
  const formattedMode = transportMode.charAt(0).toUpperCase() + transportMode.slice(1);
  const summaryText = `${formattedMode} from ${start} to ${destination}`;
  
  // 2. Få dagens datum (YYYY-MM-DD) så loggen visas under rätt dag i UI:t
  const today = new Date().toISOString().split('T')[0];

  // 3. Spara i tabellen 'eco_activities' istället för 'transport' med rätt kolumner
  const { data: savedData, error } = await supabase
    .from('eco_activities')
    .insert([
      {
        user_id: userId,
        category: 'transport',
        summary: summaryText,            // <-- Detta saknades!
        co2_emissions_kg: co2Emissions,  // <-- Matcha frontendens namn!
        activity_date: today             // <-- Gör att den dyker upp i dagens lista!
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return savedData;
}

export async function logTransportationHabit(
  data: TransportationInput,
  userId: string,
  supabase: SupabaseClient
) {
  const calculation = await calculateTransportationCO2(data);
  return storeTransportationResult({ ...calculation, userId }, supabase);
}