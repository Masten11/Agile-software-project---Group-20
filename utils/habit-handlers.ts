import { transportationHandler } from './categories/transportation';
import { showerHandler } from './categories/shower';
import { dishwasherHandler } from './categories/dishwasher';
import { UnsupportedCategoryError, InvalidPayloadError } from './custom-errors';
import {
  Category,
  CalculationResult,
  EmissionRow,
  Metrics,
} from './habit-types';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';

type AnyHabitHandler = {
  parse: (raw: unknown) => unknown;
  calculate: (parsed: unknown) => Promise<CalculationResult<unknown>>;
  store: (args: {
    parsed: unknown;
    metrics: Metrics;
    extra: unknown;
    userId: string;
    supabase: SupabaseClient;
    category: Category;
  }) => Promise<EmissionRow>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getHabitHandler(
  category: Category,
  body?: unknown
): AnyHabitHandler {
  switch (category) {
    case Category.Transportation:
      return transportationHandler as AnyHabitHandler;

    case Category.Water: {
      if (!isObject(body)) {
        throw new InvalidPayloadError();
      }

      if (body.type === 'shower') {
        return showerHandler as AnyHabitHandler;
      }

      if (body.type === 'dishwasher') {
        return dishwasherHandler as AnyHabitHandler;
      }

      throw new UnsupportedCategoryError(category);
    }

    default:
      throw new UnsupportedCategoryError(category);
  }
}