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

  if (hasFlight) return 'Du har flugit den här veckan. Tåg är ett betydligt mer klimatvänligt alternativ för resor inom Europa.';
  if (carCount >= 3) return `Du har åkt bil ${carCount} gånger den här veckan. Buss eller samåkning kan minska ditt CO₂-utsläpp med upp till 70%.`;
  return null;
}

function getShowerCo2Tip(rows: ActivityRow[]): string | null {
  const totalCo2 = rows.reduce((sum, r) => sum + r.co2_kg, 0);
  if (totalCo2 < 5) return null;
  return `Dina duschar har bidragit med ${Math.round(totalCo2 * 10) / 10} kg CO₂ den här veckan. Kortare och kallare duschar minskar både energi och utsläpp.`;
}

function getDishwasherCo2Tip(rows: ActivityRow[]): string | null {
  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);
  if (nonEcoRuns.length < 3) return null;
  return `Du har kört diskmaskinen ${nonEcoRuns.length} gånger utan eco-läge. Eco-läget kan minska CO₂-utsläppen med upp till 30%.`;
}