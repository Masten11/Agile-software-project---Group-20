// utils/transportation.js

// utils/transportation.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { TransportationData } from './transportationtype';

export async function handleTransportation(
  data: TransportationData, 
  supabase: SupabaseClient
) {
  const { start, destination, transportMode, userId } = data;

  // --- NY DEL: Anropa Google Maps på riktigt ---
  let distanceInKm: number;
  try {
    distanceInKm = await getDistance(start, destination);
  } catch (err) {
    console.error("Fel vid avståndsberäkning:", err);
    throw err; // Skickar felet vidare så frontend kan visa det
  }
  // ----------------------------------------------

  const factors: Record<string, number> = {
    car: 0.12,
    bus: 0.03,
    train: 0.01,
    bike: 0.0,
    plane: 0.25,
  };
  
  const co2Emissions = distanceInKm * (factors[transportMode] || 0.1);

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
    .single();

  if (error) throw new Error(error.message);

  return savedData;
}