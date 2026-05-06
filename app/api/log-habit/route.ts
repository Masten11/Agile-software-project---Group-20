// app/api/log-habit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';
import { parseLogHabitRequest } from '../../../utils/payload_parsing';
import { InvalidPayloadError, UnsupportedCategoryError } from '../../../utils/custom-errors';
import { getHabitHandler } from '../../../utils/habit-handlers';


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

    //Confirms data is of type {category: Category, body: unknown}
    const payload = parseLogHabitRequest(await request.json());

    const handler = getHabitHandler(payload.category);
    const parsed = handler.parse(payload.body); //Assures that the body is of the correct type for the category
    const { metrics, extra } = await handler.calculate(parsed); //Calculates the metrics and extra data for the category
    const result = await handler.store(
      {parsed, 
        metrics, 
        extra, 
        userId: user.id, 
        supabase, 
        category: payload.category}); //Stores the result in the database per category

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