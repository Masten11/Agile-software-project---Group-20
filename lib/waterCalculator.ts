import { ActivityRow, MetricResult, MetricStatus } from '@/lib/tip-types';
import { getWaterTip } from './water-rules'; // Adjusted to a relative path

const THRESHOLD_OK = 350;
const THRESHOLD_BORDERLINE = 600;

function getStatus(total: number): MetricStatus {
  if (total <= THRESHOLD_OK) return 'ok';
  if (total <= THRESHOLD_BORDERLINE) return 'borderline';
  return 'bad';
}

function findTopCategory(rows: ActivityRow[]): string | null {
  if (rows.length === 0) return null;
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.water_l);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function calculateWater(rows: ActivityRow[]): MetricResult {
  const total = rows.reduce((sum, r) => sum + r.water_l, 0);
  const status = getStatus(total);
  const topCategory = findTopCategory(rows);

  if (status === 'ok') {
    return {
      metric: 'water',
      total: Math.round(total),
      unit: 'liter',
      status,
      top_category: topCategory,
      tip: null,
    };
  }

  const tip = topCategory ? getWaterTip(topCategory, rows.filter(r => r.category === topCategory)) : null;

  return {
    metric: 'water',
    total: Math.round(total),
    unit: 'liter',
    status,
    top_category: topCategory,
    tip,
  };
}