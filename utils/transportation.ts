// utils/transportation.js

// utils/transportation.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { TransportationData } from './transportationtype';

export async function handleTransportation(
  data: TransportationData, 
  supabase: SupabaseClient
) {
  const { start, destination, transportMode, userId } = data;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // 1. Anropa Google Maps
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(start)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
  
  const response = await fetch(url);
  const googleData = await response.json();

  // 2. TA UT DISTANSEN (Här händer det!)
  // Vi går in i rows[0], sen elements[0] och hämtar distance.value
  const distanceInMeters = googleData.rows[0].elements[0].distance.value;
  
  // Gör om meter till kilometer för din beräkning
  const distanceInKm = distanceInMeters / 1000; 

  // 3. Beräkna CO2 (din befintliga kod)
  const factors: Record<string, number> = {
    car: 0.12,
    bus: 0.03,
    train: 0.01,
    bike: 0.0,
    plane: 0.25,
  };
  const co2Emissions = distanceInKm * (factors[transportMode] || 0.1);

  // 4. Spara till Supabase (din befintliga kod)
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