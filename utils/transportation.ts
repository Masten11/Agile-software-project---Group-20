// utils/transportation.js

// utils/transportation.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { TransportationData } from './transportationtype';

export async function handleTransportation(
  data: TransportationData, 
  supabase: SupabaseClient
) {
  const { start, destination, transportMode, userId } = data;

  // Google Maps anrop (exempel)
  // const distanceInKm = await getDistance(start, destination);
  const distanceInKm = 15; 

  //Beräkna CO2, genomsnittsvärden på hur många kg co2 som släpps ut per person per km. 
  const factors: Record<string, number> = {
    car: 0.12,
    bus: 0.03,
    train: 0.01,
    bike: 0.0,
    plane: 0.25,
  };
  const co2Emissions = distanceInKm * (factors[transportMode] || 0.1);

  //Spara till Supabase
  const { data: savedData, error } = await supabase
    .from('transportation')
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
    .single(); // Hämtar ut det nyss skapade objektet

  if (error) throw new Error(error.message);

  return savedData;
}