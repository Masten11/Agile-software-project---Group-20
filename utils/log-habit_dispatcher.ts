import { SupabaseClient } from '@supabase/supabase-js/dist/index.mjs';
import { Category, EmissionRow, LogHabitRequest } from './habit-types';
import { calculateTransportationCO2, storeTransportationResult } from './categories/transportation';
import { UnsupportedCategoryError } from './custom-errors';



//Calculates the CO2 emissions and stores the result in the database per category
//Assumes user is authenticated and has a valid userId
export async function logHabitDispatcher(
    request: LogHabitRequest, 
    userId: string, 
    supabase: SupabaseClient) : Promise<EmissionRow> {

    if (request.category === Category.Transportation) {
        //Result is of type TransportationCalculationResult, which storeTransportationResult expects
        const result = await calculateTransportationCO2(request.body);
        return await storeTransportationResult(result, userId, supabase);
    }

    //Add more categories here. 
    throw new UnsupportedCategoryError(request.category);
}


