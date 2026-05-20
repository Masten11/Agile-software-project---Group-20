export type Aggregation = 'sum' | 'latest_value';

export type DayRange = { label: string; dateStr: string };
export type WeekRange = { label: string; weekStart: string; weekEnd: string };
export type MonthRange = { label: string; year: number; month: number };

export type MetricRow = {
  day: string | null;
  [key: string]: string | number | null | undefined;
};

export type MetricHistory = {
  daily: number;
  weekly: { day: string; total: number }[];
  monthly: { week: string; total: number }[];
  yearly: { month: string; total: number }[];
};

export type TimeRanges = {
  last7Days: DayRange[];
  rolling5Weeks: WeekRange[];
  currentYearMonths: MonthRange[];
};

export type RunMetricOptions = {
  aggregation: Aggregation;
  decimals: number;
  metricField: string;
  carryForward?: boolean;
  initialLastKnown?: number;
};

export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateString(value: string | null | undefined): string | null {
  return value ? value.split('T')[0] : null;
}

export function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getYearMonth(dateStr: string): { year: number; month: number } {
  const [year, month] = dateStr.split('-').map(Number);
  return { year, month: month - 1 };
}

function resolveNow(now?: Date): Date {
  return now ?? new Date();
}

/** Last 7 calendar days, oldest first, today last. */
export function getLast7Days(now?: Date): DayRange[] {
  const ref = resolveNow(now);
  const result: DayRange[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(d.getDate() - i);
    result.push({
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateStr: formatDateLocal(d),
    });
  }
  return result;
}

/** Five rolling Monday-based weeks; current week is Week 5. */
export function getRolling5Weeks(now?: Date): WeekRange[] {
  const ref = resolveNow(now);
  const currentWeekStart = getStartOfWeek(ref);
  const result: WeekRange[] = [];

  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    result.push({
      label: `Week ${5 - i}`,
      weekStart: formatDateLocal(weekStart),
      weekEnd: formatDateLocal(weekEnd),
    });
  }

  return result;
}

/** Jan–Dec for the current calendar year. */
export function getCurrentYearMonths(now?: Date): MonthRange[] {
  const ref = resolveNow(now);
  const year = ref.getFullYear();
  return Array.from({ length: 12 }, (_, month) => {
    const d = new Date(year, month, 1);
    return {
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      year,
      month,
    };
  });
}

export function buildTimeRanges(now?: Date): TimeRanges {
  return {
    last7Days: getLast7Days(now),
    rolling5Weeks: getRolling5Weeks(now),
    currentYearMonths: getCurrentYearMonths(now),
  };
}

/** Earliest date needed for weekly, monthly, and yearly windows. */
export function computeFromDate(now?: Date): string {
  const ref = resolveNow(now);
  const startOfYear = new Date(ref.getFullYear(), 0, 1);

  const last7Start = new Date(ref);
  last7Start.setDate(last7Start.getDate() - 6);

  const rollingStart = new Date(getStartOfWeek(ref));
  rollingStart.setDate(rollingStart.getDate() - 28);

  const earliest = [startOfYear, last7Start, rollingStart].reduce((min, d) =>
    d < min ? d : min
  );

  return formatDateLocal(earliest);
}

function getMetricValue(row: MetricRow, metricField: string): number {
  return toNumber(row[metricField] as number | string | null | undefined);
}

function applyCarry(
  value: number | null,
  lastKnown: number,
  carryForward: boolean
): { total: number; lastKnown: number } {
  if (value !== null) {
    return { total: value, lastKnown: value };
  }
  if (carryForward) {
    return { total: lastKnown, lastKnown };
  }
  return { total: 0, lastKnown };
}

function aggregateDayBuckets(
  rows: MetricRow[],
  days: DayRange[],
  metricField: string,
  aggregation: Aggregation,
  decimals: number,
  carryForward: boolean,
  initialLastKnown: number
): { series: { day: string; total: number }[]; lastKnown: number } {
  const sums = new Map<string, number>(days.map((d) => [d.dateStr, 0]));
  const latest = new Map<string, { dateStr: string; value: number }>();

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr || !sums.has(dateStr)) continue;

    const value = getMetricValue(row, metricField);

    if (aggregation === 'sum') {
      sums.set(dateStr, (sums.get(dateStr) ?? 0) + value);
    } else if (!latest.has(dateStr) || dateStr >= (latest.get(dateStr)?.dateStr ?? '')) {
      latest.set(dateStr, { dateStr, value });
    }
  }

  let lastKnown = initialLastKnown;
  const series = days.map((day) => {
    let raw: number | null = null;
    if (aggregation === 'sum') {
      raw = sums.get(day.dateStr) ?? 0;
    } else {
      raw = latest.has(day.dateStr) ? latest.get(day.dateStr)!.value : null;
    }

    const { total, lastKnown: next } = applyCarry(
      aggregation === 'sum' ? raw : raw,
      lastKnown,
      carryForward
    );
    lastKnown = next;
    return { day: day.label, total: roundTo(total, decimals) };
  });

  return { series, lastKnown };
}

function aggregateRangeBuckets(
  rows: MetricRow[],
  ranges: { label: string; start: string; end: string }[],
  metricField: string,
  aggregation: Aggregation,
  decimals: number,
  carryForward: boolean,
  initialLastKnown: number,
  labelKey: 'week' | 'month'
): { series: Record<string, string | number>[]; lastKnown: number } {
  const sums = ranges.map(() => 0);
  const latest = ranges.map<{ dateStr: string; value: number } | null>(() => null);

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr) continue;

    const value = getMetricValue(row, metricField);

    for (let i = 0; i < ranges.length; i++) {
      if (dateStr >= ranges[i].start && dateStr <= ranges[i].end) {
        if (aggregation === 'sum') {
          sums[i] += value;
        } else if (!latest[i] || dateStr > latest[i]!.dateStr) {
          latest[i] = { dateStr, value };
        }
        break;
      }
    }
  }

  let lastKnown = initialLastKnown;
  const series = ranges.map((range, index) => {
    let raw: number | null = null;
    if (aggregation === 'sum') {
      raw = sums[index];
    } else {
      raw = latest[index]?.value ?? null;
    }

    const { total, lastKnown: next } = applyCarry(raw, lastKnown, carryForward);
    lastKnown = next;
    return { [labelKey]: range.label, total: roundTo(total, decimals) };
  });

  return { series, lastKnown };
}

function isFutureMonth(month: MonthRange, now: Date): boolean {
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  return month.year > year || (month.year === year && month.month > currentMonth);
}

function aggregateMonthBuckets(
  rows: MetricRow[],
  months: MonthRange[],
  metricField: string,
  aggregation: Aggregation,
  decimals: number,
  carryForward: boolean,
  initialLastKnown: number,
  now?: Date
): { series: { month: string; total: number }[]; lastKnown: number } {
  const ref = resolveNow(now);
  const sums = new Array(months.length).fill(0);
  const latest = months.map<{ dateStr: string; value: number } | null>(() => null);

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr) continue;

    const value = getMetricValue(row, metricField);
    const { year, month } = getYearMonth(dateStr);

    for (let i = 0; i < months.length; i++) {
      if (year === months[i].year && month === months[i].month) {
        if (aggregation === 'sum') {
          sums[i] += value;
        } else if (!latest[i] || dateStr > latest[i]!.dateStr) {
          latest[i] = { dateStr, value };
        }
        break;
      }
    }
  }

  let lastKnown = initialLastKnown;
  const series = months.map((month, index) => {
    let raw: number | null = null;
    if (aggregation === 'sum') {
      raw = sums[index];
    } else {
      raw = latest[index]?.value ?? null;
    }

    const allowCarry = carryForward && !isFutureMonth(month, ref);
    const { total, lastKnown: next } = applyCarry(raw, lastKnown, allowCarry);
    if (!isFutureMonth(month, ref)) {
      lastKnown = next;
    }
    return { month: month.label, total: roundTo(total, decimals) };
  });

  return { series, lastKnown };
}

export function runMetric(
  rows: MetricRow[],
  ranges: TimeRanges,
  options: RunMetricOptions,
  now?: Date
): MetricHistory {
  const {
    aggregation,
    decimals,
    metricField,
    carryForward = false,
    initialLastKnown = 0,
  } = options;

  const weeklyResult = aggregateDayBuckets(
    rows,
    ranges.last7Days,
    metricField,
    aggregation,
    decimals,
    carryForward,
    initialLastKnown
  );

  const monthlyRanges = ranges.rolling5Weeks.map((w) => ({
    label: w.label,
    start: w.weekStart,
    end: w.weekEnd,
  }));
  const monthlyResult = aggregateRangeBuckets(
    rows,
    monthlyRanges,
    metricField,
    aggregation,
    decimals,
    carryForward,
    initialLastKnown,
    'week'
  );

  const yearlyResult = aggregateMonthBuckets(
    rows,
    ranges.currentYearMonths,
    metricField,
    aggregation,
    decimals,
    carryForward,
    initialLastKnown,
    now
  );

  const today = formatDateLocal(resolveNow(now));
  let daily: number;

  if (aggregation === 'sum') {
    daily = roundTo(
      rows
        .filter((row) => normalizeDateString(row.day) === today)
        .reduce((sum, row) => sum + getMetricValue(row, metricField), 0),
      decimals
    );
  } else if (carryForward && weeklyResult.series.length > 0) {
    daily = weeklyResult.series[weeklyResult.series.length - 1].total;
  } else {
    let best: { dateStr: string; value: number } | null = null;
    for (const row of rows) {
      const dateStr = normalizeDateString(row.day);
      if (dateStr !== today) continue;
      const value = getMetricValue(row, metricField);
      if (!best || dateStr >= best.dateStr) {
        best = { dateStr, value };
      }
    }
    const { total } = applyCarry(best?.value ?? null, initialLastKnown, carryForward);
    daily = roundTo(total, decimals);
  }

  return {
    daily,
    weekly: weeklyResult.series,
    monthly: monthlyResult.series as { week: string; total: number }[],
    yearly: yearlyResult.series,
  };
}

/** Seed carry-forward from the latest score row strictly before fromDate. */
export function seedLastKnownFromPriorScore(
  rows: MetricRow[],
  fromDate: string,
  metricField: string
): number {
  let best: { dateStr: string; value: number } | null = null;

  for (const row of rows) {
    const dateStr = normalizeDateString(row.day);
    if (!dateStr || dateStr >= fromDate) continue;
    const value = getMetricValue(row, metricField);
    if (!best || dateStr > best.dateStr) {
      best = { dateStr, value };
    }
  }

  return best?.value ?? 0;
}
