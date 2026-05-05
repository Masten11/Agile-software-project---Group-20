import { Category, LogHabitRequest, UnlogHabitRequest } from "./habit-types";
import { InvalidPayloadError } from "./custom-errors";



//Helper functions to validate the payload
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
  

//Helper function to validate the UUID
function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
  

//Function to parse the log habit request, used in log-habit endpoint
//Must parse all categories, and return the correct type for the category
//Return type LogHabitRequest is described in habit-types.ts
export function parseLogHabitRequest(payload: unknown): LogHabitRequest {
    if (!isObject(payload) || typeof payload.category !== 'string' || !('body' in payload)) {
        throw new InvalidPayloadError();
    }

    const knownCategories = Object.values(Category);
    if (knownCategories.includes(payload.category as Category)) {
      return {
        category: payload.category as Category,
        body: payload.body,
      };
    }

    throw new InvalidPayloadError(`Unknown category: ${payload.category}`);
}


//Function to parse the unlog habit request, used in unlog-habit endpoint
export function parseUnlogHabitRequest(payload: unknown): UnlogHabitRequest {
    if (!isObject(payload) || typeof payload.id !== 'string') {
        throw new InvalidPayloadError();
    }

    if (!isUuid(payload.id)) {
        throw new InvalidPayloadError();
    }

    return {
        id: payload.id
    };
}
