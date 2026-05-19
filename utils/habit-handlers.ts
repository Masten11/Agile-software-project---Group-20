import { transportationHandler } from './categories/transportation';
import { showerHandler } from './categories/shower';
import { dishwasherHandler } from './categories/dishwasher';
import { washingMachineHandler } from './categories/washingMachine';
import { clothesHandler } from './categories/clothes';
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

  if (category === Category.WashingMachine) {
    return washingMachineHandler;
  }

  if (category === Category.Clothes) {
    return clothesHandler;
  }

  throw new UnsupportedCategoryError(category);
}
