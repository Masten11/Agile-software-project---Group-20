import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseLogHabitRequest } from '../../../utils/payload_parsing';
import { InvalidPayloadError, UnsupportedCategoryError } from '../../../utils/custom-errors';
import { getHabitHandler } from '../../../utils/habit-handlers';
import { resolveDayFromOffset } from '../../../utils/day_offset';

// IMPORT the separated functions
import { 
  calculateUserEcoScore, 
  logDailyScores, 
  updateUserProfile 
} from '../../../lib/eco-score'; 

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

    const rawBody = await request.json();
    const payload = parseLogHabitRequest(rawBody);
    const day = resolveDayFromOffset(payload.dayOffset);

    const handler = getHabitHandler(payload.category);
    const parsed = handler.parse(payload.body); 
    const { metrics, extra } = await handler.calculate(parsed); 
    
    const result = await handler.store({
      parsed, 
      metrics, 
      extra, 
      userId: user.id, 
      supabase, 
      category: payload.category,
      day,
    }); 

    // 1. Calculate the scores (No database writes here)
    const { currentScore, dailyScores } = await calculateUserEcoScore(user.id, supabase);

    // 2. Log the history to eco_score_log
    await logDailyScores(user.id, dailyScores, supabase);

    // 3. Update the user's current score in profiles
    await updateUserProfile(user.id, currentScore, supabase);

    return NextResponse.json({
      success: true,
      message: 'Habit entry created.',
      data: result,
      eco_score: currentScore,
    }, { status: 201 });

  } 
  catch (error: unknown) {
    if (error instanceof InvalidPayloadError || error instanceof UnsupportedCategoryError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}