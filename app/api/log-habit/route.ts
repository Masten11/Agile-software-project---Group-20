// app/api/log-habit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer'; 
import { handleTransportation } from '../../../utils/transportation';
import { TransportationData } from '../../../utils/transportationtype';

// En interface för att typa det inkommande paketet från frontend
interface LogHabitRequest extends Omit<TransportationData, 'userId'> {
  category: 'transportation' | 'food'; // Utöka med fler kategorier senare 
}

export async function POST(request: NextRequest) {
  try {
    //kapa Supabase-klienten 
    const supabase = await createClient();

    //Verifiera att användaren är inloggad via sessionen
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'you have not logged in' },
        { status: 401 } // 401 Unauthorized
      );
    }

    //så att man inte kan göra för många loggar 
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabase
      .from('transportation')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo);

    if (count !== null && count >= 100) {
      return NextResponse.json(
        { error: 'you hade reached the max request limit, try again tomorrow' },
        { status: 429 } // 429 betyder "Too Many Requests"
      );
    }

    // Hämta datan från frontenden
    const body: LogHabitRequest = await request.json();
    const { category, ...data } = body;

    // Logik baserat på kategori
    if (category === 'transportation') {
      // Vi skickar med user.id från servern för säkerhet, 
      // så frontenden inte kan "fuska" med ett annat ID.
      const result = await handleTransportation(
        { ...data, userId: user.id },
        supabase
      );

      return NextResponse.json({
        success: true,
        message: 'The trip has been logged!',
        data: result
      });
    }

    // Om kategorin inte finns än
    return NextResponse.json(
      { error: `category "${category}" is not supported.` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'server error' },
      { status: 500 }
    );
  }
}