import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseUnlogHabitRequest } from '../../../utils/habit-types';
import { dispatchUnlogHabit } from '../../../utils/unlogHabitDispatcher';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'you have not logged in' },
        { status: 401 }
      );
    }

    const payload = parseUnlogHabitRequest(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: 'invalid request body' },
        { status: 400 }
      );
    }

    const result = await dispatchUnlogHabit(payload, user.id, supabase);
    if (result === null) {
      return NextResponse.json(
        { error: 'habit entry not found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit entry removed.',
      data: result
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
