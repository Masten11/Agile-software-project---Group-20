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
  const { start, destination, transportMode, distanceInKm, co2Emissions, userId } = data;

  const { data: savedData, error } = await supabase
    .from('transport')
    .insert([
      {
        user_id: userId,
        from_location: start,
        to_location: destination,
        distance: distanceInKm,
        co2_emissions: co2Emissions,
        mode: transportMode
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

