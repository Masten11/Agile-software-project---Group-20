// co2-rules.ts

import { ActivityRow } from '@/lib/tip-types';

export function getCo2Tip(category: string, rows: ActivityRow[]): string | null {
  switch (category) {
    case 'transport':  return getTransportCo2Tip(rows);
    case 'shower':     return getShowerCo2Tip(rows);
    case 'dishwasher': return getDishwasherCo2Tip(rows);
    default:           return null;
  }
}

function getTransportCo2Tip(rows: ActivityRow[]): string | null {
  const modes = rows.map(r => r.details?.transportMode as string | undefined).filter(Boolean);
  const hasFlight = modes.includes('flight');
  const carCount = modes.filter(m => m === 'car').length;
  const busCount = modes.filter(m => m === 'bus').length;

  if (hasFlight) return 'You flew this week. Taking the train is a much more climate-friendly option for travel within Europe.';
  if (carCount >= 3) return `You drove a car ${carCount} times this week. Taking the bus or carpooling can reduce your CO₂ emissions by up to 70%.`;
  if (busCount >= 3) return 'You already take the bus regularly — great job! For shorter distances, cycling can reduce emissions even further.';
  return null;
}

function getShowerCo2Tip(rows: ActivityRow[]): string | null {
  const totalCo2 = rows.reduce((sum, r) => sum + r.co2_kg, 0);
  if (totalCo2 < 5) return null;

  const durations = rows.map(r => r.details?.minutes as number | undefined).filter(Boolean) as number[];
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  if (avgDuration && avgDuration > 8) {
    return `Your showers average ${avgDuration} minutes and have contributed ${Math.round(totalCo2 * 10) / 10} kg of CO₂ this week. Try to keep showers under 5 minutes.`;
  }

  return `Your showers have contributed ${Math.round(totalCo2 * 10) / 10} kg of CO₂ this week. Shorter and cooler showers reduce both energy use and emissions.`;
}

function getDishwasherCo2Tip(rows: ActivityRow[]): string | null {
  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);
  if (nonEcoRuns.length < 3) return null;
  return `You ran the dishwasher ${nonEcoRuns.length} times without eco mode this week. Using eco mode can reduce CO₂ emissions by up to 30%.`;
}