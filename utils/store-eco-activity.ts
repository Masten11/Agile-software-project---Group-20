import { Eco_Activities_Row, Metrics, Category } from './habit-types';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';

type StoreEcoActivityArgs = {
  userId: string;
  supabase: SupabaseClient;
  category: Category;
  metrics: Metrics;
  details: Record<string, unknown>;
  day: string;
};

export async function storeEcoActivity({
  userId,
  supabase,
  category,
  metrics,
  details,
  day,
}: StoreEcoActivityArgs): Promise<Eco_Activities_Row> {
  const { data: savedData, error } = await supabase
    .from('eco_activities')
    .insert([
      {
        user_id: userId,
        category,
        co2_kg: metrics.co2_kg,
        water_l: metrics.water_l,
        energy_kwh: metrics.energy_kwh,
        details,
        day,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return savedData;
}
