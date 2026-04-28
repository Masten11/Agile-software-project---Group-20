import { SupabaseClient } from '@supabase/supabase-js';
import { Category, LogHabitRequest } from './habit-types';
import { logTransportationHabit } from './transportation';

export async function dispatchLogHabit(
  request: LogHabitRequest,
  userId: string,
  supabase: SupabaseClient
) {
  if (request.category === Category.Transportation) {
    return logTransportationHabit(request.body, userId, supabase);
  }

  return null;
}
