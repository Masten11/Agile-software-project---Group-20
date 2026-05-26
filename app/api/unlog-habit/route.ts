import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseUnlogHabitRequest } from '../../../utils/payload_parsing';
import { unlogHabit } from '../../../utils/unlog-habit';
import { EmissionNotFoundError, InvalidPayloadError } from '../../../utils/custom-errors';

// 1. Make sure to import logDailyScores!
import { calculateUserEcoScore, logDailyScores, updateUserProfile } from '../../../lib/eco-score';

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

    // May throw EmissionNotFoundError
    await unlogHabit(payload.id, user.id, supabase);

    // 2. Unpack the object into two separate variables using { }
    const { currentScore, dailyScores } = await calculateUserEcoScore(user.id, supabase);

    // 3. Log the updated daily history (important when removing a habit!)
    await logDailyScores(user.id, dailyScores, supabase);

    // 4. Update the profile with the integer
    await updateUserProfile(user.id, currentScore, supabase);
   
    return NextResponse.json({
      success: true,
      message: 'Emission entry removed.',
      eco_score: currentScore, // <-- Make sure to use currentScore here
    }, { status: 200 });

  } 
  catch (error) {
    // Handle known errors
    if (error instanceof InvalidPayloadError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof EmissionNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    // Handle unknown errors
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}