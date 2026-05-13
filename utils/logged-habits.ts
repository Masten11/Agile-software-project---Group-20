import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import { Category, Eco_Activities_Row } from './habit-types';
import { DayOffset } from './day_offset';
import { isDayOffset } from './payload_parsing';
import { InvalidPayloadError, UnsupportedCategoryError } from './custom-errors';

export type LoggedHabitsResponse = Record<Category, Eco_Activities_Row[]>;

const KNOWN_CATEGORIES = Object.values(Category) as Category[];

function createEmptyLoggedHabits(): LoggedHabitsResponse {
  const grouped = {} as LoggedHabitsResponse;

  for (const category of KNOWN_CATEGORIES) {
    grouped[category] = [];
  }

  return grouped;
}

function isKnownCategory(category: string): category is Category {
  return KNOWN_CATEGORIES.includes(category as Category);
}

export function parseDayOffsetFromSearchParams(searchParams: URLSearchParams): DayOffset {
  const raw = searchParams.get('dayOffset');

  if (raw === null) {
    throw new InvalidPayloadError('dayOffset query parameter is required');
  }

  const parsed = Number(raw);
  if (!isDayOffset(parsed)) {
    throw new InvalidPayloadError('dayOffset must be 0 or 1');
  }

  return parsed;
}

export async function fetchLoggedHabitsForDay(
  supabase: SupabaseClient,
  userId: string,
  day: string,
): Promise<Eco_Activities_Row[]> {
  const { data, error } = await supabase
    .from('eco_activities')
    .select('*')
    .eq('user_id', userId)
    .eq('day', day)
    .order('created_at', { ascending: false })
    .returns<Eco_Activities_Row[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function groupLoggedHabitsByCategory(rows: Eco_Activities_Row[]): LoggedHabitsResponse {
  const grouped = createEmptyLoggedHabits();

  for (const row of rows) {
    if (!isKnownCategory(row.category)) {
      throw new UnsupportedCategoryError(row.category);
    }
    grouped[row.category].push(row);
  }

  return grouped;
}
