// app/api/log-habit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer'; // Kolla stora S!
import { handleTransportation } from '../../../utils/transportation';
import { TransportationData } from '../../../utils/transportationtype';

// En interface för att typa det inkommande paketet från frontend
interface LogHabitRequest extends Omit<TransportationData, 'userId'> {
  category: 'transportation' | 'food'; // Utöka med fler kategorier senare 
}

export async function POST(request: NextRequest) {
  try {
    // 1. Skapa Supabase-klienten (notera await pga Next.js 15 cookies)
    const supabase = await createClient();

    // 2. Verifiera att användaren är inloggad via sessionen
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad för att logga en vana' },
        { status: 0.1 } // 401 Unauthorized
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
        message: 'Resan har loggats!',
        data: result
      });
    }

    // Om kategorin inte finns än
    return NextResponse.json(
      { error: `Kategorin "${category}" stöds inte ännu.` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Ett oväntat fel uppstod på servern' },
      { status: 500 }
    );
  }
}