// app/api/log-habit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseLogHabitRequest } from '../../../utils/habit-types';
import { dispatchLogHabit } from '../../../utils/logHabitDispatcher';
import { hasRateLimitConfig, rateLimitByCategory } from '../../../utils/rateLimit';

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
    if (!payload) {
      return NextResponse.json(
        { error: 'invalid request body' },
        { status: 400 }
      );
    }

    //Kontrollera om användaren har nått gränsen för antalet loggar för denna kategori
    if (hasRateLimitConfig(payload.category)) {
      const rateLimitResult = await rateLimitByCategory(supabase, user.id, payload.category);
      if (rateLimitResult.isLimited) {
        return NextResponse.json(
          { error: 'you hade reached the max request limit, try again tomorrow' },
          { status: 429 } // 429 betyder "Too Many Requests"
        );
      }
    }

    //Beräknar CO2-utsläppen beroende på vilken habit som loggas
    const result = await dispatchLogHabit(payload, user.id, supabase);
    if (!result) {
      return NextResponse.json(
        { error: `category "${payload.category}" is not supported.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Emission entry created.',
      data: result
    }, { status: 201 });

  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}