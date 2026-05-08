import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseLogHabitRequest } from '../../../utils/payload_parsing';
import {
  InvalidPayloadError,
  UnsupportedCategoryError,
} from '../../../utils/custom-errors';
import { getHabitHandler } from '../../../utils/habit-handlers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'you have not logged in' },
        { status: 401 }
      );
    }

    const payload = parseLogHabitRequest(await request.json());

    const handler = getHabitHandler(payload.category, payload.body);

    const parsed = handler.parse(payload.body);

    const { metrics, extra } = await handler.calculate(parsed);

    const result = await handler.store({
      parsed,
      metrics,
      extra,
      userId: user.id,
      supabase,
      category: payload.category,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Emission entry created.',
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      error instanceof InvalidPayloadError ||
      error instanceof UnsupportedCategoryError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'server error';

    console.error('API Error:', error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}