// water-rules.ts

import { ActivityRow } from '@/lib/tip-types';

export function getWaterTip(category: string, rows: ActivityRow[], weeklyTotal: number): string | null {
  switch (category) {
    case 'shower':     return getShowerWaterTip(rows, weeklyTotal);
    case 'dishwasher': return getDishwasherWaterTip(rows, weeklyTotal);
    default:           return null;
  }
}

function getShowerWaterTip(rows: ActivityRow[], weeklyTotal: number): string | null {
  const totalShowerWater = rows.reduce((sum, r) => sum + r.water_l, 0);
  const avgWaterPerShower = Math.round(totalShowerWater / rows.length);

  const durations = rows.map(r => r.details?.minutes as number | undefined).filter(Boolean) as number[];
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  if (avgDuration) {
    return `You used ${weeklyTotal} liters of water this week. Your showers are the biggest source, averaging ${avgDuration} minutes and ${avgWaterPerShower} liters each. Try to keep showers under 5 minutes.`;
  }

  return `You used ${weeklyTotal} liters of water this week. Your showers are the biggest source, averaging ${avgWaterPerShower} liters each. Try to take shorter showers.`;
}

function getDishwasherWaterTip(rows: ActivityRow[], weeklyTotal: number): string | null {
  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);
  const totalDishwasherWater = rows.reduce((sum, r) => sum + r.water_l, 0);

  if (nonEcoRuns.length >= 3) {
    return `You used ${weeklyTotal} liters of water this week. Your dishwasher is the biggest source, using ${Math.round(totalDishwasherWater)} liters. You ran it ${nonEcoRuns.length} times without eco mode — switching to eco mode can save up to 30% water.`;
  }

  return `You used ${weeklyTotal} liters of water this week. Your dishwasher is the biggest source, using ${Math.round(totalDishwasherWater)} liters. Try running it less frequently or use eco mode.`;
}