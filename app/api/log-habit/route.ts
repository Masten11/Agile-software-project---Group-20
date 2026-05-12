import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseLogHabitRequest } from '../../../utils/payload_parsing';
import { InvalidPayloadError, UnsupportedCategoryError } from '../../../utils/custom-errors';
import { getHabitHandler } from '../../../utils/habit-handlers';
import { resolveDayFromOffset } from '../../../utils/log-habit-day';

export async function POST(request: NextRequest) {
  try {
    // Skapa Supabase-klienten och validera att användaren är inloggad
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'you have not logged in' },
        { status: 401 } // 401 Unauthorized
      );
    }

    const rawBody = await request.json();

    // Confirms data is of type { category: Category, dayOffset: 0 | 1, body: unknown }
    const payload = parseLogHabitRequest(rawBody);
    const day = resolveDayFromOffset(payload.dayOffset);

    const handler = getHabitHandler(payload.category);
    const parsed = handler.parse(payload.body); // Assures that the body is of the correct type for the category
    const { metrics, extra } = await handler.calculate(parsed); // Calculates the metrics and extra data for the category
    
    const result = await handler.store({
      parsed, 
      metrics, 
      extra, 
      userId: user.id, 
      supabase, 
      category: payload.category,
      day,
    }); 

    // Return the saved row from the database
    return NextResponse.json({
      success: true,
      message: 'Habit entry created.',
      data: result
    }, { status: 201 });

  } 
  catch (error: unknown) {
    if (error instanceof InvalidPayloadError || error instanceof UnsupportedCategoryError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Unhandled error
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}