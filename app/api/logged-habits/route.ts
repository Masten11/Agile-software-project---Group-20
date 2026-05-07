// /api/logged-habits/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { Category, Eco_Activities_Row } from '../../../utils/habit-types';
import { UnsupportedCategoryError } from '../../../utils/custom-errors';

const KNOWN_CATEGORIES = [Category.Transportation, Category.Shower, Category.Dishwasher] as const;
type KnownCategory = (typeof KNOWN_CATEGORIES)[number];

type LoggedHabitsResponse = Record<KnownCategory, Eco_Activities_Row[]>;

function createEmptyLoggedHabits(): LoggedHabitsResponse {
  return {
    [Category.Transportation]: [],
    [Category.Shower]: [],
    [Category.Dishwasher]: [],
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

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Query directly from eco_activities table
    const { data, error } = await supabase
      .from('view_today_habits')
      .select('*')
      .eq('user_id', user.id)
      .returns<Eco_Activities_Row[]>();

    if (error) {
      throw error;
    }

    // Group by category
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