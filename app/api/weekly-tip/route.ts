// src/app/api/weekly-tips/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { ActivityRow } from '@/lib/tip-types';
import { dispatchMetrics } from '@/lib/dispatcherMetrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'not logged in' }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: rows, error: fetchError } = await supabase
      .from('eco_activities')
      .select('id, user_id, category, co2_kg, water_l, energy_kwh, details, created_at, day')
      .eq('user_id', user.id)
      .gte('day', sevenDaysAgoStr)
      .returns<ActivityRow[]>();

    if (fetchError) throw fetchError;
    if (!rows || rows.length === 0) return NextResponse.json({ tips: [] });

    const tips = dispatchMetrics(rows);
    return NextResponse.json({ tips });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}