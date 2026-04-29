# Log Habit Endpoint

This document explains how the `log-habit` endpoint works today and how to add a new habit category/question safely.

## Endpoint Purpose

`POST /api/log-habit` receives a habit log request, validates authentication, parses payload, calculates CO2 impact, and stores the result in the database.

Main entrypoint: `app/api/log-habit/route.ts`

## Input Type (Request Body)

The endpoint accepts JSON with this top-level structure:

```ts
type LogHabitRequest = {
  category: "transport";
  body: TransportationInput;
};
```

Current category-specific input type:

```ts
type TransportationInput = {
  start: string;
  destination: string;
  transportMode: "car" | "bus" | "train" | "plane" | "bike";
};
```

Example request:

```json
{
  "category": "transport",
  "body": {
    "start": "Stockholm",
    "destination": "Uppsala",
    "transportMode": "train"
  }
}
```

## Return Type (Response Body)

Returned when the habit is successfully logged:

```ts
type LogHabitSuccessResponse = {
  success: true;
  message: "Emission entry created.";
  data: EmissionRow;
};
```


## Request Lifecycle (4 Parts)

1. **Auth**  
   Validate authenticated user through Supabase (`supabase.auth.getUser()`).
2. **Parsing**  
   Parse and type-guard payload with `parseLogHabitRequest(...)` in `utils/payload_parsing.ts`.
3. **Calculation**  
   `logHabitDispatcher(...)` routes by category and runs category-specific CO2 calculation.
4. **Storing**  
   Category storage function inserts the calculated result into Supabase and returns the saved row.
   This happens inside `logHabitDispatcher(...)`

The endpoint then returns a success response with persisted data.

## Current Category Flow (Transportation)

Current supported category is `transportation` (`utils/habit-types.ts`).

- Dispatcher route: `utils/log-habit_dispatcher.ts` -> `logHabitDispatcher(...)`
- Category helper: `utils/categories/transportation.ts`
  - `calculateTransportationCO2(...)`
  - `storeTransportationResult(...)`

## Type Safety Contract

Type safety is centralized in `utils/habit-types.ts` and `utils/payload_parsing.ts`:

- `Category` enum defines allowed categories.
- `LogHabitRequest` defines accepted payload shapes (currently transportation only).
- `parseLogHabitRequest(payload)` validates and returns a typed `LogHabitRequest`.
- Invalid payload/category paths are handled through custom errors (for example `InvalidPayloadError`, `UnsupportedCategoryError`) instead of nullable returns.

This guarantees that downstream dispatcher/category helpers receive strongly typed data.

## Scope Note: No Rate Limiting

Rate limiting has been removed from this endpoint because it is out of scope for this project.

## How To Add A New Category/Question

Use this checklist in order:

1. Add category enum value in `utils/habit-types.ts`.  
   Make sure its string value matches the target table in the database.
2. Define input type for the new category (for example in `utils/categories/<category>.ts`).
3. Extend `LogHabitRequest` to include the new category payload type.
4. Extend `parseLogHabitRequest(...)` in `utils/payload_parsing.ts` with a new typed branch.
5. Implement category functions in `utils/categories/<category>.ts`:
   - `calculate<Category>CO2(...)`
   - `store<Category>Result(...)`
6. Add dispatcher case in `utils/log-habit_dispatcher.ts` to call the category calculate/store flow.
7. Verify DB schema/table/column names match the new category store function.

## Suggested Category Module Pattern

For each category, keep the same function split:

- `calculate...`: domain calculation (input -> CO2 result)
- `store...`: persistence (Supabase insert/select)

This keeps each category independent and makes it easy to add more categories without changing endpoint flow.
