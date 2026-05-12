import { calculateCo2 } from "./c02Calculator";
import { calculateWater } from "./waterCalculator";
import { calculateEnergy } from "./energyCalculator";
import { ActivityRow, MetricResult } from "@/lib/tip-types";


export function dispatchMetrics(rows: ActivityRow[]): MetricResult[] {
    const co2Rows    = rows.filter(r => r.co2_kg > 0);
    const waterRows  = rows.filter(r => r.water_l > 0);
    const energyRows = rows.filter(r => r.energy_kwh > 0);
  
    return [
      calculateCo2(co2Rows),
      calculateWater(waterRows),
      calculateEnergy(energyRows),
    ];
  }