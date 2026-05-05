# Log Habit Endpoint

This document explains how the `log-habit` endpoint works and how to add a new habit category safely.

## Endpoint Purpose

`POST /api/log-habit` receives a habit log request, validates authentication, parses payload, calculates metrics, and stores the result in the database.

Main entrypoint: `app/api/log-habit/route.ts`

## Input Type (Request Body)

The endpoint accepts JSON with this top-level structure:

```ts
type LogHabitRequest = {
  category: Category;
  body: unknown;
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

## Request Lifecycle (7 Parts)

1. **Auth**  
   Create Supabase client with `createClient()`, then validate authenticated user with `supabase.auth.getUser()`.
2. **Request Parsing**  
   Read body, then validate top-level shape with `parseLogHabitRequest(...)`. This ensures payload matches `{ category: Category, body: unknown }`.
   This ensures payload matches `{ category: Category, body: unknown }`.
3. **Handler Lookup**  
   Call `getHabitHandler(payload.category)`, which returns a category-specific handler containing `parse`, `calculate`, and `store` functions.
4. **Parse**
    Call `handler.parse(payload.body)`, which validates and narrows the body to the correct type for the category.
5. **Calculate**
    Call `await handler.calculate(parsed)`, which calculates the metrics and extra data for the category.
6. **Store**
    Call `handler.store({ parsed, metrics, extra, userId, supabase, category })`, which stores the result in the database.
7. **Respond**
    Return `NextResponse.json(...)` with status `201` and payload `{ success: true, message, data }`.

## Current Category Flow (Transportation)

Current supported category is `transportation` (`utils/habit-types.ts`).

- Handler registry: `utils/habit-handlers.ts` -> `getHabitHandler(...)`
- Category helper: `utils/categories/transportation.ts`
  - `parse(...)`
  - `calculate(...)`
  - `store(...)`

## Type Safety Contract

Type safety is centralized in `utils/habit-types.ts`, `utils/payload_parsing.ts`, and each category handler:

- `Category` enum defines allowed categories.
- `LogHabitRequest` validates and types the top-level request envelope.
- Category-specific validation and narrowing happen in handler `parse(...)`.
- Handler `calculate(...)` is always async and returns `Promise<{ metrics, extra }>` for consistency and to preserve computed context.
- `Metrics` requires complete metric output (`co2_kg`, `water_l`, `energy_kwh`) from every handler.
- Invalid payload/category paths are handled through custom errors (for example `InvalidPayloadError`, `UnsupportedCategoryError`) instead of nullable returns.

This guarantees all category handlers follow one consistent contract.

## Scope Note: No Rate Limiting

Rate limiting has been removed from this endpoint because it is out of scope for this project.

## How To Add A New Category/Question

Use this checklist in order:

1. Add category enum value in `utils/habit-types.ts`.  
   Make sure its string value matches `emissions.category`.
2. Implement a category handler in `utils/categories/<category>.ts`:
   - `parse(raw)`
   - `calculate(parsed): Promise<{ metrics: Metrics; extra: T }>`
   - `store({ parsed, metrics, extra, userId, supabase, category })`
3. Register the handler in `utils/habit-handlers.ts`.
4. Verify DB schema/table/column names match the store function.

## Suggested Category Module Pattern

For each category, keep the same handler split:

- `parse`: payload validation and narrowing
- `calculate`: domain calculation (input -> `{ metrics, extra }`)
- `store`: persistence (Supabase insert/select), including serialized `details`

This keeps each category independent and makes it easy to add more categories without changing endpoint flow.
Make sure to understand the handler contract in `utils/habit-types.ts`.
