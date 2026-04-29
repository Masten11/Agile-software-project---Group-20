// app/api/log-habit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseLogHabitRequest } from '../../../utils/payload_parsing';
import { logHabitDispatcher } from '../../../utils/log-habit_dispatcher';
import { InvalidPayloadError, UnsupportedCategoryError } from '../../../utils/custom-errors';


export async function POST(request: NextRequest) {
  try {
    //Skapa Supabase-klienten och validera att användaren är inloggad
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'you have not logged in' },
        { status: 401 } // 401 Unauthorized
      );
    }

    //Hämta datan från frontenden och validera formatet
    const payload = parseLogHabitRequest(await request.json());

    //Calculates the CO2 emissions and stores the result in the database per category
    const result = await logHabitDispatcher(payload, user.id, supabase);

    //Return the saved row from the database
    return NextResponse.json({
      success: true,
      message: 'Emission entry created.',
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

    //Unhandled error
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}