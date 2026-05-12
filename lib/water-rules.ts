// water-rules.ts
import { ActivityRow } from '@/lib/tip-types';

export function getWaterTip(category: string, rows: ActivityRow[]): string | null {
  switch (category) {
    case 'shower':     return getShowerWaterTip(rows);
    case 'dishwasher': return getDishwasherWaterTip(rows);
    default:           return null;
  }
}

function getShowerWaterTip(rows: ActivityRow[]): string | null {
  const totalWater = rows.reduce((sum, r) => sum + r.water_l, 0);
  const avgWaterPerShower = Math.round(totalWater / rows.length);

  if (avgWaterPerShower < 30) return null;

  return `Dina duschar använder i snitt ${avgWaterPerShower} liter vatten per gång. Försök korta ner duschtiden för att minska förbrukningen.`;
}

function getDishwasherWaterTip(rows: ActivityRow[]): string | null {
  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);

  if (nonEcoRuns.length < 3) return null;

  return `Du har kört diskmaskinen ${nonEcoRuns.length} gånger utan eco-läge den här veckan. Eco-läget kan spara upp till 30% vatten per körning.`;
}