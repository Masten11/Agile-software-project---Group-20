import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

type HistoricalRow = {
  day: string | null;
  co2_kg: number | string | null;
  water_l: number | string | null;
  energy_kwh: number | string | null;
};

type MetricKey = 'co2_kg' | 'water_l' | 'energy_kwh';

type DayRange = { label: string; dateStr: string };
type WeekRange = { label: string; weekStart: string; weekEnd: string };
type MonthRange = { label: string; year: number; month: number };

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateString(value: string | null | undefined): string | null {
  return value ? value.split('T')[0] : null;
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7; // Monday-based week to match Postgres date_trunc('week', ...)
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getYearMonth(dateStr: string): { year: number; month: number } {
  const [year, month] = dateStr.split('-').map(Number);
  return { year, month: month - 1 };
}

/* ── Helpers för dynamiska etiketter ── */

// Senaste 7 dagarna med idag sist
function getLast7Days(): { label: string; dateStr: string }[] {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' }); // Mon, Tue...
    const dateStr = formatDateLocal(d);
    result.push({ label, dateStr });
  }
  return result;
}

// Alla veckor i innevarande månad, grupperade som Postgres date_trunc('week', day)
function getCurrentMonthWeeks(): { label: string; weekStart: string; weekEnd: string }[] {
  const result = [];
  const seenWeekStarts = new Set<string>();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let weekIndex = 1;
  for (const cursor = new Date(firstDay); cursor <= lastDay; cursor.setDate(cursor.getDate() + 1)) {
    const weekStart = getStartOfWeek(cursor);
    const weekStartStr = formatDateLocal(weekStart);

    if (seenWeekStarts.has(weekStartStr)) continue;

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    result.push({
      label: `Week ${weekIndex++}`,
      weekStart: weekStartStr,
      weekEnd: formatDateLocal(weekEnd),
    });
    seenWeekStarts.add(weekStartStr);
  }
  return result;
}

// Innevarande år, Jan-Dec
function getCurrentYearMonths(): { label: string; year: number; month: number }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, month) => {
    const d = new Date(now.getFullYear(), month, 1);
    return {
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      year: d.getFullYear(),
      month,
    };
  });
}

function buildDailySeries(
  rows: HistoricalRow[],
  days: { label: string; dateStr: string }[],
  metric: MetricKey,
  decimals: number
) {
  const totals = new Map<string, number>(days.map((day) => [day.dateStr, 0]));

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr || !totals.has(dateStr)) continue;

    totals.set(dateStr, (totals.get(dateStr) ?? 0) + toNumber(row[metric]));
  }

  return days.map((day) => ({
    day: day.label,
    total: roundTo(totals.get(day.dateStr) ?? 0, decimals),
  }));
}

function buildWeeklySeries(
  rows: HistoricalRow[],
  weeks: { label: string; weekStart: string; weekEnd: string }[],
  metric: MetricKey,
  decimals: number
) {
  const totals = new Array(weeks.length).fill(0);

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr) continue;

    for (let i = 0; i < weeks.length; i++) {
      if (dateStr >= weeks[i].weekStart && dateStr <= weeks[i].weekEnd) {
        totals[i] += toNumber(row[metric]);
        break;
      }
    }
  }

  return weeks.map((week, index) => ({
    week: week.label,
    total: roundTo(totals[index], decimals),
  }));
}

function buildYearlySeries(
  rows: HistoricalRow[],
  months: { label: string; year: number; month: number }[],
  metric: MetricKey,
  decimals: number
) {
  const totals = new Array(months.length).fill(0);

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr) continue;

    const { year, month } = getYearMonth(dateStr);

    for (let i = 0; i < months.length; i++) {
      if (year === months[i].year && month === months[i].month) {
        totals[i] += toNumber(row[metric]);
        break;
      }
    }
  }

  return months.map((month, index) => ({
    month: month.label,
    total: roundTo(totals[index], decimals),
  }));
}

function buildTodayTotal(rows: HistoricalRow[], metric: MetricKey, decimals: number): number {
  const today = formatDateLocal(new Date());

  return roundTo(
    rows
      .filter((row) => normalizeDateString(row.day) === today)
      .reduce((sum, row) => sum + toNumber(row[metric]), 0),
    decimals
  );
}

function buildMetricHistory(
  rows: HistoricalRow[],
  metric: MetricKey,
  decimals: number,
  days: DayRange[],
  weeks: WeekRange[],
  months: MonthRange[]
) {
  return {
    daily: buildTodayTotal(rows, metric, decimals),
    weekly: buildDailySeries(rows, days, metric, decimals),
    monthly: buildWeeklySeries(rows, weeks, metric, decimals),
    yearly: buildYearlySeries(rows, months, metric, decimals),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'you have not logged in' }, { status: 401 });
    }

    // Hämta data från den tidigaste punkt som behövs för:
    // - senaste 7 dagarna
    // - innevarande månad
    // - innevarande år
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const last7Start = new Date();
    last7Start.setDate(last7Start.getDate() - 6);
    const fromDate = formatDateLocal(last7Start < startOfYear ? last7Start : startOfYear);

    const { data: rawData, error: rawError } = await supabase
      .from('eco_activities')
      .select('day, co2_kg, water_l, energy_kwh')
      .eq('user_id', user.id)
      .gte('day', fromDate)
      .returns<HistoricalRow[]>();

    if (rawError) throw rawError;

    const rows = rawData ?? [];
    const last7Days = getLast7Days();
    const currentMonthWeeks = getCurrentMonthWeeks();
    const currentYearMonths = getCurrentYearMonths();

    return NextResponse.json({
      co2_kg: buildMetricHistory(rows, 'co2_kg', 2, last7Days, currentMonthWeeks, currentYearMonths),
      water_l: buildMetricHistory(rows, 'water_l', 1, last7Days, currentMonthWeeks, currentYearMonths),
      energy_kwh: buildMetricHistory(rows, 'energy_kwh', 2, last7Days, currentMonthWeeks, currentYearMonths),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'server error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}