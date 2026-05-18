// co2-rules.ts

import { ActivityRow } from '@/lib/tip-types';

export function getCo2Tip(category: string, rows: ActivityRow[]): string | null {
  switch (category) {
    case 'transport':  return getTransportCo2Tip(rows);
    case 'shower':     return getShowerCo2Tip(rows);
    case 'dishwasher': return getDishwasherCo2Tip(rows);
    case 'washingmachine': return null; // No specific tip for washing machine yet
    case 'clothes':     return null; // No specific tip for clothes yet
    default:           return null;
  }
}

function getTransportCo2Tip(rows: ActivityRow[]): string | null {
  const modeTotals = new Map<string, number>();

  for (const row of rows) {
    const mode = row.details?.transportMode as string | undefined;
    if (!mode) continue;
    modeTotals.set(mode, (modeTotals.get(mode) ?? 0) + row.co2_kg);
  }

  if (modeTotals.size === 0) return null;

  const topMode = [...modeTotals.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const topTotal = Math.round(modeTotals.get(topMode)! * 10) / 10;

  switch (topMode) {
    case 'plane':
      return `Flying is your biggest CO₂ source this week with ${topTotal} kg. Taking the train is a much more climate-friendly option for travel within Europe.`;
    case 'car':
      return `Driving is your biggest CO₂ source this week with ${topTotal} kg. Taking the bus, train or carpooling can reduce your CO₂ emissions by up to 70%.`;
    case 'bus':
      return `Great job taking the bus! It contributed ${topTotal} kg CO₂ this week. For shorter distances, cycling can reduce emissions even further.`;
    default:
      return null;
  }
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

function getWashingMachineCo2Tip(rows: ActivityRow[]): string | null {
  return null; // No specific tip for washing machine yet
}


function getClothesCo2Tip(rows: ActivityRow[]): string | null {
  return null; // No specific tip for clothes yet
}
