import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

type RowData = {
  total_co2: number | string | null;
  user_id: string;
  activity_date?: string;
  date?: string;
  week_start?: string;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHLY_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'] as const; 
const YEARLY_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'you have not logged in' }, { status: 401 });
    }

    const [todayRes, weeklyRes, monthlyRes] = await Promise.all([
      supabase.from('view_today_total_co2').select('total_co2,user_id').eq('user_id', user.id).maybeSingle<RowData>(),
      supabase.from('view_weekly_per_day_co2').select('date,total_co2,user_id').eq('user_id', user.id).returns<RowData[]>(),
      supabase.from('view_monthly_per_week_co2').select('week_start,total_co2,user_id').eq('user_id', user.id).returns<RowData[]>(),
    ]);

    if (todayRes.error || weeklyRes.error || monthlyRes.error) {
      throw todayRes.error || weeklyRes.error || monthlyRes.error;
    }

    const daily_stats = { today_total: toNumber(todayRes.data?.total_co2) };

    // --- CO2 VECKOGRAF ---
    const weeklyBucketMap = new Map<string, number>(WEEKDAY_LABELS.map((day) => [day, 0]));
    for (const row of weeklyRes.data ?? []) {
      const rowDateStr = row.date || row.activity_date;
      if (!rowDateStr) continue;
      
      const dateOnly = rowDateStr.split('T')[0];
      const date = new Date(dateOnly);
      if (Number.isNaN(date.getTime())) continue;
      
      const jsDay = date.getDay(); 
      const labelIndex = jsDay === 0 ? 6 : jsDay - 1;
      const normalizedDayLabel = WEEKDAY_LABELS[labelIndex];

      if (!weeklyBucketMap.has(normalizedDayLabel)) continue;

      const current = weeklyBucketMap.get(normalizedDayLabel) ?? 0;
      weeklyBucketMap.set(normalizedDayLabel, current + toNumber(row.total_co2));
    }
    const weekly_stats = WEEKDAY_LABELS.map((day) => ({ day, total: weeklyBucketMap.get(day) ?? 0 }));

    // --- CO2 MÅNADSOGRAF ---
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartMs = monthStart.getTime();
    const msPerWeek = 1000 * 60 * 60 * 24 * 7;
    const monthlyTotals = [0, 0, 0, 0, 0]; 

    for (const row of monthlyRes.data ?? []) {
      const rowDateStr = row.week_start || row.date || row.activity_date;
      if (!rowDateStr) continue;

      const dateOnly = rowDateStr.split('T')[0];
      const weekStartDate = new Date(dateOnly);
      if (Number.isNaN(weekStartDate.getTime())) continue;

      const diff = weekStartDate.getTime() - monthStartMs;
      const bucketIndex = Math.min(4, Math.max(0, Math.floor(diff / msPerWeek)));
      monthlyTotals[bucketIndex] += toNumber(row.total_co2);
    }
    const monthly_stats = MONTHLY_LABELS.map((week, index) => ({ week, total: monthlyTotals[index] }));

    // --- ÅRSGRAF (Både CO2 och VATTEN hämtas från rådata) ---
    const currentYear = new Date().getFullYear();
    const nowMs = new Date().getTime();
    const sevenDaysAgoMs = nowMs - (7 * 24 * 60 * 60 * 1000);

    const { data: rawData } = await supabase
      .from('eco_activities')
      .select('activity_date, co2_kg, water_l') // <-- HÄR hämtar vi vattnet!
      .eq('user_id', user.id)
      .gte('activity_date', `${currentYear - 1}-12-01`); // Hämtar från dec för att täcka hela året + lite till

    const yearlyTotals = new Array(12).fill(0);
    
    // Register för vatten
    const waterWeeklyMap = new Map<string, number>(WEEKDAY_LABELS.map((day) => [day, 0]));
    const waterMonthlyTotals = [0, 0, 0, 0, 0]; 
    const waterYearlyTotals = new Array(12).fill(0);

    for (const row of rawData ?? []) {
      if (!row.activity_date) continue;
      
      const dateOnly = row.activity_date.split('T')[0];
      const dateObj = new Date(dateOnly);
      const time = dateObj.getTime();
      if (Number.isNaN(time)) continue;

      const water = toNumber(row.water_l);
      const co2 = toNumber(row.co2_kg);

      // Fyll på ÅR för CO2 & Vatten
      if (dateObj.getFullYear() === currentYear) {
        const monthIndex = dateObj.getMonth();
        yearlyTotals[monthIndex] += co2;
        waterYearlyTotals[monthIndex] += water;
      }

      // Fyll på MÅNAD för Vatten (CO2 sköts av vyn ovan)
      if (time >= monthStartMs) {
        const diff = time - monthStartMs;
        const bucketIndex = Math.min(4, Math.max(0, Math.floor(diff / msPerWeek)));
        waterMonthlyTotals[bucketIndex] += water;
      }

      // Fyll på VECKA för Vatten
      if (time >= sevenDaysAgoMs) {
        const jsDay = dateObj.getDay(); 
        const labelIndex = jsDay === 0 ? 6 : jsDay - 1;
        const normalizedDayLabel = WEEKDAY_LABELS[labelIndex];
        waterWeeklyMap.set(normalizedDayLabel, (waterWeeklyMap.get(normalizedDayLabel) ?? 0) + water);
      }
    }

    const yearly_stats = YEARLY_LABELS.map((month, index) => ({ month, total: yearlyTotals[index] }));
    const water_weekly_stats = WEEKDAY_LABELS.map((day) => ({ day, total: waterWeeklyMap.get(day) ?? 0 }));
    const water_monthly_stats = MONTHLY_LABELS.map((week, index) => ({ week, total: waterMonthlyTotals[index] }));
    const water_yearly_stats = YEARLY_LABELS.map((month, index) => ({ month, total: waterYearlyTotals[index] }));

    return NextResponse.json({
      unit: 'kg',
      daily_stats,
      weekly_stats,
      monthly_stats,
      yearly_stats,
      // Nya fält för vatten:
      water_weekly_stats,
      water_monthly_stats,
      water_yearly_stats
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}