import { ActivityRow } from '@/lib/tip-types';

export function getEnergyTip(category: string, rows: ActivityRow[]): string | null {
  switch (category) {
    case 'shower':     return getShowerEnergyTip(rows);
    case 'dishwasher': return getDishwasherEnergyTip(rows);
    default:           return null;
  }
}

function getShowerEnergyTip(rows: ActivityRow[]): string | null {
  const totalEnergy = rows.reduce((sum, r) => sum + r.energy_kwh, 0);
  const avgEnergyPerShower = totalEnergy / rows.length;

  if (avgEnergyPerShower < 1) return null;

  return `Dina duschar använder i snitt ${Math.round(avgEnergyPerShower * 10) / 10} kWh per gång. Kortare och kallare duschar kan minska energiförbrukningen betydligt.`;
}

function getDishwasherEnergyTip(rows: ActivityRow[]): string | null {
  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);

  if (nonEcoRuns.length < 3) return null;

  return `Du har kört diskmaskinen ${nonEcoRuns.length} gånger utan eco-läge den här veckan. Eco-läget kan minska energiförbrukningen med upp till 40% per körning.`;
}