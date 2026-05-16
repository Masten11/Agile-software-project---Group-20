import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseUnlogHabitRequest } from '../../../utils/payload_parsing';
import { unlogHabit } from '../../../utils/unlog-habit';
import { calculateUserEcoScore, updateUserProfile } from '../../../lib/eco_score';
import { EmissionNotFoundError, InvalidPayloadError } from '../../../utils/custom-errors';

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


    //May throw EmissionNotFoundError
    await unlogHabit(payload.id, user.id, supabase);

    const newScore = await calculateUserEcoScore(user.id, supabase);
    await updateUserProfile(user.id, newScore, supabase);

    return NextResponse.json({
      success: true,
      message: 'Emission entry removed.',
      eco_score: newScore,
    }, { status: 200 });

  } 
  catch (error) {
    if (error instanceof InvalidPayloadError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    
    console.log(await request.json());
    }

    if (error instanceof EmissionNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    //Unhandled error
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
