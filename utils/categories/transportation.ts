import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import { TransportationInput, TransportMode } from '../habit-types';

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

//Returns the saved row from the database
export async function storeTransportationResult(
  data: TransportationCalculationResult, 
  userId: string,
  supabase: SupabaseClient
) {
  const { start, destination, transportMode, distanceInKm, co2Emissions} = data;

  const { data: savedData, error } = await supabase
    .from('emissions')
    .insert([
      {
        user_id: userId,
        category: 'transport',
        co2_kg: co2Emissions,
        details: {
          start,
          destination,
          transportMode,
          distanceInKm,
        },
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return savedData;
}


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