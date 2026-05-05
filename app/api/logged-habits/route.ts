import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { Category, EmissionRow } from '../../../utils/habit-types';
import { UnsupportedCategoryError } from '../../../utils/custom-errors';

const KNOWN_CATEGORIES = [Category.Transportation] as const;
type KnownCategory = (typeof KNOWN_CATEGORIES)[number];

type LoggedHabitsResponse = Record<KnownCategory, EmissionRow[]>;

function createEmptyLoggedHabits(): LoggedHabitsResponse {
  return {
    [Category.Transportation]: [],
  };
}

function isKnownCategory(category: string): category is KnownCategory {
  return KNOWN_CATEGORIES.includes(category as KnownCategory);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'you have not logged in' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('view_today_details')
      .select('id,user_id,category,co2_kg,details,created_at')
      .eq('user_id', user.id)
      .returns<EmissionRow[]>();

    if (error) {
      throw error;
    }

    const grouped = createEmptyLoggedHabits();

    for (const row of data ?? []) {
      if (!isKnownCategory(row.category)) {
        throw new UnsupportedCategoryError(row.category);
      }

      grouped[row.category].push(row);
    }

    return NextResponse.json(grouped, { status: 200 });
  } 
  catch (error: unknown) {
    if (error instanceof UnsupportedCategoryError) {
      console.error('Category mismatch in logged-habits endpoint:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
