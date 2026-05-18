import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { CATEGORY_CONFIG, isValidCategory } from '@/lib/config';
import { getWeeklyUsage } from '@/lib/getWeeklyUsage';
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
//kollar så att usern är inloggad 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You have not logged in' },
        { status: 401 }
      );
    }
//läser json filen och kollar så att den innehåller user_id och category, och att category är giltig

    const body = await request.json();
    const { user_id, category } = body;

    if (!user_id || !category) {
      return NextResponse.json(
        { error: 'Missing user_id or category' },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (user.id !== user_id) {
      return NextResponse.json(
        { error: 'You are not allowed to access this user data' },
        { status: 403 }
      );
    }
//hämtar konfigurationen för den valda kategorin, hämtar totalen för den kategorin från databasen, beräknar impact value och returnerar allt i ett JSON svar
    const config = CATEGORY_CONFIG[category];

    const total = await getWeeklyUsage(
      supabase,
      user_id,
      config.viewName,
      config.totalColumn
    );

    const rawImpactValue = config.calculate(total);
    const impactValue = Number(rawImpactValue.toFixed(1));

    return NextResponse.json({
      user_id,
      category,
      total,
      total_unit: config.totalUnit,
      impact_value: impactValue,
      impact_unit: config.impactUnit,
      text: config.createText(impactValue),
    });
  }  catch (error) {
    console.error('ENGAGING API ERROR:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }}