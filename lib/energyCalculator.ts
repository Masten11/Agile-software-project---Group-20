import { ActivityRow, MetricResult, MetricStatus } from '@/lib/tip-types';
import { getEnergyTip } from './energy-rules'; // Adjust the path as necessary

const THRESHOLD_OK = 12;
const THRESHOLD_BORDERLINE = 20;

function getStatus(total: number): MetricStatus {
  if (total <= THRESHOLD_OK) return 'ok';
  if (total <= THRESHOLD_BORDERLINE) return 'borderline';
  return 'bad';
}

function findTopCategory(rows: ActivityRow[]): string | null {
  if (rows.length === 0) return null;
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.energy_kwh);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function calculateEnergy(rows: ActivityRow[]): MetricResult {
  const total = rows.reduce((sum, r) => sum + r.energy_kwh, 0);
  const status = getStatus(total);
  const topCategory = findTopCategory(rows);

  if (status === 'ok') {
    return {
      metric: 'energy',
      total: Math.round(total * 10) / 10,
      unit: 'kWh',
      status,
      top_category: topCategory,
      tip: null,
    };
  }

  const tip = topCategory ? getEnergyTip(topCategory, rows.filter(r => r.category === topCategory), Math.round(total * 10) / 10) : null;

  return {
    metric: 'energy',
    total: Math.round(total * 10) / 10,
    unit: 'kWh',
    status,
    top_category: topCategory,
    tip,
  };
}