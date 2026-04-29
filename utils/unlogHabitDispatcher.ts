import { SupabaseClient } from '@supabase/supabase-js';
import { unlogTransportationHabit } from './transportation';

export async function dispatchUnlogHabit(
  id: string,
  userId: string,
  supabase: SupabaseClient
) {
  return unlogTransportationHabit(id, userId, supabase);
}
