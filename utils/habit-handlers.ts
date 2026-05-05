import { transportationHandler } from './categories/transportation';
import { UnsupportedCategoryError } from './custom-errors';
import { Category, HabitHandler } from './habit-types';

export function getHabitHandler(category: Category): HabitHandler<any, any> {
  if (category === Category.Transportation) {
    return transportationHandler;
  }

  throw new UnsupportedCategoryError(category);
}
