// co2-rules.ts

import { ActivityRow } from '@/lib/tip-types';

export function getCo2Tip(category: string, rows: ActivityRow[]): string | null {
  switch (category) {
    case 'transport':  return getTransportCo2Tip(rows);
    case 'shower':     return getShowerCo2Tip(rows);
    case 'dishwasher': return getDishwasherCo2Tip(rows);
    case 'washingmachine': return getWashingMachineCo2Tip(rows); 
    case 'clothes':     return getClothesCo2Tip(rows); 
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
  const totalCo2 = rows.reduce((sum, r) => sum + r.co2_kg, 0);
  if (totalCo2 < 1) return null;

  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);
  const highTempRuns = rows.filter(r => (r.details?.temperatureCelsius as number) >= 60);

  if (nonEcoRuns.length >= 2) {
    return `You ran the washing machine ${nonEcoRuns.length} times without eco mode this week. Eco mode uses up to 35% less energy, which directly reduces CO₂ emissions.`;
  }

  if (highTempRuns.length >= 2) {
    return `You washed at 60°C or higher ${highTempRuns.length} times this week. Most laundry gets just as clean at 30–40°C, which uses significantly less energy and produces less CO₂.`;
  }

  return `Your washing machine contributed ${Math.round(totalCo2 * 10) / 10} kg of CO₂ this week. Combining full loads and using eco mode are the most effective ways to reduce emissions.`;
}


function getClothesCo2Tip(rows: ActivityRow[]): string | null {
  const totalCo2 = rows.reduce((sum, r) => sum + r.co2_kg, 0);
  if (totalCo2 < 1) return null;

  const itemCount = rows.length;
  const roundedCo2 = Math.round(totalCo2 * 10) / 10;

  return `You bought ${itemCount} clothing item${itemCount !== 1 ? 's' : ''} this week, contributing ${roundedCo2} kg of CO₂. Buying second-hand on Vinted produces up to 70% less CO₂ than buying new.`;
}
