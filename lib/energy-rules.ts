import { ActivityRow } from '@/lib/tip-types';

export function getEnergyTip(category: string, rows: ActivityRow[], weeklyTotal: number): string | null {
  switch (category) {
    case 'shower':     return getShowerEnergyTip(rows, weeklyTotal);
    case 'dishwasher': return getDishwasherEnergyTip(rows, weeklyTotal);
    default:           return null;
  }
}

function getShowerEnergyTip(rows: ActivityRow[], weeklyTotal: number): string | null {
  const totalShowerEnergy = rows.reduce((sum, r) => sum + r.energy_kwh, 0);
  const avgEnergyPerShower = totalShowerEnergy / rows.length;

  const durations = rows.map(r => r.details?.minutes as number | undefined).filter(Boolean) as number[];
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  if (avgDuration) {
    return `You used ${weeklyTotal} kWh this week. Your showers are the biggest source, averaging ${avgDuration} minutes and ${Math.round(avgEnergyPerShower * 10) / 10} kWh each. Try to keep showers under 5 minutes to save energy.`;
  }

  return `You used ${weeklyTotal} kWh this week. Your showers are the biggest source, averaging ${Math.round(avgEnergyPerShower * 10) / 10} kWh each. Try taking shorter and cooler showers.`;
}

function getDishwasherEnergyTip(rows: ActivityRow[], weeklyTotal: number): string | null {
  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);
  const ecoRuns = rows.filter(r => r.details?.ecoMode === true);
  const totalDishwasherEnergy = rows.reduce((sum, r) => sum + r.energy_kwh, 0);

  if (nonEcoRuns.length >= 3) {
    return `You used ${weeklyTotal} kWh this week. Your dishwasher is the biggest source, using ${Math.round(totalDishwasherEnergy * 10) / 10} kWh. You ran it ${nonEcoRuns.length} times without eco mode — switching to eco mode can reduce energy use by up to 40%.`;
  }

  if (ecoRuns.length >= 3) {
    return `You used ${weeklyTotal} kWh this week. Your dishwasher is the biggest source, using ${Math.round(totalDishwasherEnergy * 10) / 10} kWh. Great job using eco mode! Try to only run it when it's fully loaded to save even more energy.`;
  }

  return null;
}