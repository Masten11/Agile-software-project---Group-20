import { Category } from './types';

export const CATEGORY_CONFIG: Record<
  Category,
  {
    viewName: string;
    totalColumn: string;
    totalUnit: string;
    impactUnit: string;
    calculate: (total: number) => number;
    createText: (impactValue: number) => string;
  }
> = {
  co2: {
    viewName: 'view_week_total_co2',
    totalColumn: 'total_co2',
    totalUnit: 'kg_co2',
    impactUnit: 'trees_per_year',
    calculate: (total) => total / 20,
    createText: (impactValue) =>
      `It would take ${impactValue} trees one full year to absorb your CO₂ emissions from the last 7 days.`,
  },

  water: {
    viewName: 'view_week_total_water',
    totalColumn: 'total_water',
    totalUnit: 'liters',
    impactUnit: 'm2_farmland_one_day',
    calculate: (total) => total / 4,
    createText: (impactValue) =>
      `Your water usage from the last 7 days could irrigate ${impactValue} m² of farmland for one day.`,
  },

  electricity: {
    viewName: 'view_week_total_electricity',
    totalColumn: 'total_electricity',
    totalUnit: 'kwh',
    impactUnit: 'basic_households_one_day',
    calculate: (total) => total / 1,
    createText: (impactValue) =>
      `Your electricity usage from the last 7 days could provide basic electricity to ${impactValue} households for one day.`,
  },
};

export function isValidCategory(category: string): category is Category {
  return category === 'co2' || category === 'water' || category === 'electricity';
}