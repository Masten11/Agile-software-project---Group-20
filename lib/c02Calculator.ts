import { ActivityRow, MetricResult, MetricStatus } from '@/lib/tip-types';
import { getCo2Tip } from '@/lib/co2-rules';

const THRESHOLD_OK = 50;
const THRESHOLD_BORDERLINE = 100;

function getStatus(total: number): MetricStatus {
  if (total <= THRESHOLD_OK) return 'ok';
  if (total <= THRESHOLD_BORDERLINE) return 'borderline';
  return 'bad';
}

function findTopCategory(rows: ActivityRow[]): string | null {
  if (rows.length === 0) return null;
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.co2_kg);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function calculateCo2(rows: ActivityRow[]): MetricResult {
  const total = rows.reduce((sum, r) => sum + r.co2_kg, 0);
  const status = getStatus(total);
  const topCategory = findTopCategory(rows);

  if (status === 'ok') {
    return { metric: 'co2', total: Math.round(total * 10) / 10, unit: 'kg', status, top_category: topCategory, tip: null };
  }

  const tip = topCategory ? getCo2Tip(topCategory, rows.filter(r => r.category === topCategory)) : null;

  return { metric: 'co2', total: Math.round(total * 10) / 10, unit: 'kg', status, top_category: topCategory, tip };
}