import { ActivityRow } from '@/lib/tip-types';

export function getEnergyTip(category: string, rows: ActivityRow[], weeklyTotal: number): string | null {
  switch (category) {
    case 'shower':     return getShowerEnergyTip(rows, weeklyTotal);
    case 'dishwasher': return getDishwasherEnergyTip(rows, weeklyTotal);
    case 'washingmachine': return getWashingMachineEnergyTip(rows, weeklyTotal); // No specific tip for washing machine yet
    case 'transport':     return getTransportEnergyTip(rows, weeklyTotal); // No specific tip for transport in energy yet
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


function getWashingMachineEnergyTip(rows: ActivityRow[], weeklyTotal: number): string | null {
  const totalEnergy = rows.reduce((sum, r) => sum + r.energy_kwh, 0);
  if (totalEnergy < 0.5) return null;

  const nonEcoRuns = rows.filter(r => r.details?.ecoMode === false);
  const highTempRuns = rows.filter(r => (r.details?.temperatureCelsius as number) >= 60);

  if (nonEcoRuns.length >= 2) {
    return `You ran the washing machine ${nonEcoRuns.length} times without eco mode this week, using ${Math.round(totalEnergy * 10) / 10} kWh in total. Eco mode reduces energy consumption by up to 35% per wash.`;
  }

  if (highTempRuns.length >= 2) {
    return `You washed at 60°C or higher ${highTempRuns.length} times this week. Around 90% of a washing machine's energy goes to heating water — washing at 30–40°C can cut energy use significantly.`;
  }

  return `Your washing machine used ${Math.round(totalEnergy * 10) / 10} kWh this week. Full loads and lower temperatures are the most effective ways to reduce energy consumption.`;
}

function getTransportEnergyTip(rows: ActivityRow[], weeklyTotal: number): string | null {
  const totalEnergy = rows.reduce((sum, r) => sum + r.energy_kwh, 0);
  if (totalEnergy < 0.5) return null;

  const roundedEnergy = Math.round(totalEnergy * 10) / 10;
  const modes = rows.map(r => r.details?.transportMode as string | undefined).filter(Boolean);
  const hasElectricBus = modes.some(m => m === 'electric_bus');
  const hasElectricCar = modes.some(m => m === 'electric_car');

  if (hasElectricBus || hasElectricCar) {
    return `Your biggest energy source this week is electric transport, using ${roundedEnergy} kWh. Great choice over fuel-powered vehicles! For shorter distances, cycling uses no energy at all.`;
  }

  return `Your transport used ${roundedEnergy} kWh this week. Switching to electric bus or train is more energy-efficient than fuel — and cycling is the best option for shorter distances.`;
}