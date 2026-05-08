import { transportationHandler } from './categories/transportation';
import { showerHandler } from './categories/shower';
import { dishwasherHandler } from './categories/dishwasher';
import { UnsupportedCategoryError } from './custom-errors';
import { Category, HabitHandler } from './habit-types';

export function getHabitHandler(category: Category): HabitHandler<any, any> {
  if (category === Category.Transportation) {
    return transportationHandler;
  }

  if (category === Category.Shower) {
    return showerHandler;
  }

  if (category === Category.Dishwasher) {
    return dishwasherHandler;
  }

  throw new UnsupportedCategoryError(category);
}
