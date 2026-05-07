import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';

type TodayRow = {
  total_co2: number | string | null;
  user_id: string;
};

type WeeklyRow = {
  date: string;
  total_co2: number | string | null;
  user_id: string;
};

type MonthlyRow = {
  week_start: string;
  total_co2: number | string | null;
  user_id: string;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

const WEEKDAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'] as const;
const MONTHLY_LABELS = ['v.1', 'v.2', 'v.3', 'v.4'] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'you have not logged in' },
        { status: 401 }
      );
    }

    const [todayRes, weeklyRes, monthlyRes] = await Promise.all([
      supabase
        .from('view_today_total_co2')
        .select('total_co2,user_id')
        .eq('user_id', user.id)
        .maybeSingle<TodayRow>(),
      supabase
        .from('view_weekly_per_day_co2')
        .select('date,total_co2,user_id')
        .eq('user_id', user.id)
        .returns<WeeklyRow[]>(),
      supabase
        .from('view_monthly_per_week_co2')
        .select('week_start,total_co2,user_id')
        .eq('user_id', user.id)
        .returns<MonthlyRow[]>(),
    ]);

    if (todayRes.error || weeklyRes.error || monthlyRes.error) {
      throw todayRes.error || weeklyRes.error || monthlyRes.error;
    }

    const daily_stats = {
      today_total: toNumber(todayRes.data?.total_co2),
    };

    const weeklyBucketMap = new Map<string, number>(
      WEEKDAY_LABELS.map((day) => [day, 0])
    );

    for (const row of weeklyRes.data ?? []) {
      const date = new Date(row.date);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      // getDay() returnerar 0 för Sön, 1 för Mån, 2 för Tis etc.
      const jsDay = date.getDay(); 
      
      // Eftersom WEEKDAY_LABELS börjar med Måndag på index 0, flyttar vi Söndag (0) till slutet (6)
      const labelIndex = jsDay === 0 ? 6 : jsDay - 1;
      const normalizedDayLabel = WEEKDAY_LABELS[labelIndex];

      if (!weeklyBucketMap.has(normalizedDayLabel)) {
        continue;
      }

      const current = weeklyBucketMap.get(normalizedDayLabel) ?? 0;
      weeklyBucketMap.set(normalizedDayLabel, current + toNumber(row.total_co2));
    }

    const weekly_stats = WEEKDAY_LABELS.map((day) => ({
      day,
      total: weeklyBucketMap.get(day) ?? 0,
    }));

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartMs = monthStart.getTime();
    const msPerWeek = 1000 * 60 * 60 * 24 * 7;

    const monthlyTotals = [0, 0, 0, 0];

    for (const row of monthlyRes.data ?? []) {
      const weekStartDate = new Date(row.week_start);
      if (Number.isNaN(weekStartDate.getTime())) {
        continue;
      }

      const diff = weekStartDate.getTime() - monthStartMs;
      const bucketIndex = Math.min(3, Math.max(0, Math.floor(diff / msPerWeek)));
      monthlyTotals[bucketIndex] += toNumber(row.total_co2);
    }

    const monthly_stats = MONTHLY_LABELS.map((week, index) => ({
      week,
      total: monthlyTotals[index],
    }));

    return NextResponse.json({
      unit: 'kg',
      daily_stats,
      weekly_stats,
      monthly_stats,
      yearly_stats: [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
