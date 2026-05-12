import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/* ── Helpers för dynamiska etiketter ── */

// Senaste 7 dagarna med idag sist
function getLast7Days(): { label: string; dateStr: string }[] {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' }); // Mon, Tue...
    const dateStr = d.toISOString().split('T')[0];
    result.push({ label, dateStr });
  }
  return result;
}

// Senaste 5 veckorna med denna vecka sist
function getLast5Weeks(): { label: string; weekStart: string; weekEnd: string }[] {
  const result = [];
  for (let i = 4; i >= 0; i--) {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    result.push({
      label: `Week ${5 - i}`,
      weekStart: start.toISOString().split('T')[0],
      weekEnd: end.toISOString().split('T')[0],
    });
  }
  return result;
}

// Senaste 12 månaderna med denna månad sist
function getLast12Months(): { label: string; year: number; month: number }[] {
  const result = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-GB', { month: 'short' }); // Jan, Feb...
    result.push({ label, year: d.getFullYear(), month: d.getMonth() }); // month: 0-indexed
  }
  return result;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'you have not logged in' }, { status: 401 });
    }

    // Hämta all rådata för senaste 12 månaderna
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const fromDate = twelveMonthsAgo.toISOString().split('T')[0];

    const { data: rawData, error: rawError } = await supabase
      .from('eco_activities')
      .select('day, co2_kg, water_l')
      .eq('user_id', user.id)
      .gte('day', fromDate);

    if (rawError) throw rawError;

    const rows = rawData ?? [];

    /* ── CO2 VECKA: senaste 7 dagarna ── */
    const last7Days = getLast7Days();
    const weeklyMap = new Map<string, number>(last7Days.map(d => [d.dateStr, 0]));

    for (const row of rows) {
      const dateStr = row.day?.split('T')[0];
      if (!dateStr || !weeklyMap.has(dateStr)) continue;
      weeklyMap.set(dateStr, (weeklyMap.get(dateStr) ?? 0) + toNumber(row.co2_kg));
    }
    const weekly_stats = last7Days.map(d => ({
      day: d.label,
      total: Number((weeklyMap.get(d.dateStr) ?? 0).toFixed(2)),
    }));

    /* ── CO2 MÅNAD: senaste 5 veckorna ── */
    const last5Weeks = getLast5Weeks();
    const monthlyTotals = new Array(5).fill(0);

    for (const row of rows) {
      const dateStr = row.day?.split('T')[0];
      if (!dateStr) continue;
      for (let i = 0; i < last5Weeks.length; i++) {
        if (dateStr >= last5Weeks[i].weekStart && dateStr <= last5Weeks[i].weekEnd) {
          monthlyTotals[i] += toNumber(row.co2_kg);
          break;
        }
      }
    }
    const monthly_stats = last5Weeks.map((w, i) => ({
      week: w.label,
      total: Number(monthlyTotals[i].toFixed(2)),
    }));

    /* ── CO2 ÅR: senaste 12 månaderna ── */
    const last12Months = getLast12Months();
    const yearlyTotals = new Array(12).fill(0);

    for (const row of rows) {
      const dateStr = row.day?.split('T')[0];
      if (!dateStr) continue;
      const d = new Date(dateStr);
      for (let i = 0; i < last12Months.length; i++) {
        if (d.getFullYear() === last12Months[i].year && d.getMonth() === last12Months[i].month) {
          yearlyTotals[i] += toNumber(row.co2_kg);
          break;
        }
      }
    }
    const yearly_stats = last12Months.map((m, i) => ({
      month: m.label,
      total: Number(yearlyTotals[i].toFixed(2)),
    }));

    /* ── VATTEN: samma logik ── */
    const waterWeeklyMap = new Map<string, number>(last7Days.map(d => [d.dateStr, 0]));
    const waterMonthlyTotals = new Array(5).fill(0);
    const waterYearlyTotals = new Array(12).fill(0);

    for (const row of rows) {
      const dateStr = row.day?.split('T')[0];
      if (!dateStr) continue;
      const water = toNumber(row.water_l);

      // Vecka
      if (waterWeeklyMap.has(dateStr)) {
        waterWeeklyMap.set(dateStr, (waterWeeklyMap.get(dateStr) ?? 0) + water);
      }

      // Månad
      for (let i = 0; i < last5Weeks.length; i++) {
        if (dateStr >= last5Weeks[i].weekStart && dateStr <= last5Weeks[i].weekEnd) {
          waterMonthlyTotals[i] += water;
          break;
        }
      }

      // År
      const d = new Date(dateStr);
      for (let i = 0; i < last12Months.length; i++) {
        if (d.getFullYear() === last12Months[i].year && d.getMonth() === last12Months[i].month) {
          waterYearlyTotals[i] += water;
          break;
        }
      }
    }

    const water_weekly_stats = last7Days.map(d => ({
      day: d.label,
      total: Number((waterWeeklyMap.get(d.dateStr) ?? 0).toFixed(1)),
    }));
    const water_monthly_stats = last5Weeks.map((w, i) => ({
      week: w.label,
      total: Number(waterMonthlyTotals[i].toFixed(1)),
    }));
    const water_yearly_stats = last12Months.map((m, i) => ({
      month: m.label,
      total: Number(waterYearlyTotals[i].toFixed(1)),
    }));

    /* ── Today total ── */
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTotal = rows
      .filter(r => r.day?.split('T')[0] === todayStr)
      .reduce((sum, r) => sum + toNumber(r.co2_kg), 0);

    return NextResponse.json({
      unit: 'kg',
      daily_stats: { today_total: Number(todayTotal.toFixed(2)) },
      weekly_stats,
      monthly_stats,
      yearly_stats,
      water_weekly_stats,
      water_monthly_stats,
      water_yearly_stats,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}