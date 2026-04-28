import { SupabaseClient } from '@supabase/supabase-js';
import { Category, UnlogHabitRequest } from './habit-types';
import { unlogTransportationHabit } from './transportation';

export async function dispatchUnlogHabit(
  request: UnlogHabitRequest,
  userId: string,
  supabase: SupabaseClient
) {
  if (request.category === Category.Transportation) {
    return unlogTransportationHabit(request.body.id, userId, supabase);
  }

  return null;
}
