// /api/logged-habits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { InvalidPayloadError, UnsupportedCategoryError } from '../../../utils/custom-errors';
import { resolveDayFromOffset } from '../../../utils/day_offset';
import {
  fetchLoggedHabitsForDay,
  groupLoggedHabitsByCategory,
  parseDayOffsetFromSearchParams,
} from '../../../utils/logged-habits';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'you have not logged in' }, { status: 401 });
    }

    const offset = parseDayOffsetFromSearchParams(request.nextUrl.searchParams);
    const day = resolveDayFromOffset(offset);
    const rows = await fetchLoggedHabitsForDay(supabase, user.id, day);
    const grouped = groupLoggedHabitsByCategory(rows);

    return NextResponse.json(grouped, { status: 200 });
  }
  catch (error: unknown) {
    if (error instanceof InvalidPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof UnsupportedCategoryError) {
      console.error('Category mismatch in logged-habits endpoint:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
