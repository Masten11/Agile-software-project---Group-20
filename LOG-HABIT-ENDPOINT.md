# Log Habit Endpoint

This document explains how the `log-habit` endpoint works today and how to add a new habit category/question safely.

## Endpoint Purpose

`POST /api/log-habit` receives a habit log request, validates/authenticates it, rate-limits by category, dispatches category-specific logic, calculates CO2 impact, and stores the result in the database.

Main entrypoint: `app/api/log-habit/route.ts`

## Request Lifecycle

1. Receive request in `POST`.
2. Validate authenticated user through Supabase (`supabase.auth.getUser()`).
3. Parse and type-guard payload with `parseLogHabitRequest(...)` so the returned object is a valid `LogHabitRequest`.
4. Apply category rate limit via `hasRateLimitConfig(...)` + `rateLimitByCategory(...)`.
5. Dispatch category-specific execution through `dispatchLogHabit(...)`.
6. Category helper performs:
   - CO2 calculation
   - Database insert of the computed result
7. Return success response with persisted data.

## Current Category Flow (Transportation)

Current supported category is `transportation` (`utils/habit-types.ts`).

- Dispatcher route: `utils/logHabitDispatcher.ts` -> `logTransportationHabit(...)`
- Category helper: `utils/transportation/index.ts`
  - `calculateTransportationCO2(...)`
  - `storeTransportationResult(...)`
  - `logTransportationHabit(...)` (orchestrates calculate + store)

## Type Safety Contract

Type safety is centralized in `utils/habit-types.ts`:

- `Category` enum defines allowed categories.
- `LogHabitRequest` defines accepted payload shapes (currently transportation only).
- `parseLogHabitRequest(payload)` returns:
  - `LogHabitRequest` when valid
  - `null` when invalid

This guarantees that downstream dispatcher/category helpers receive strongly typed data.

## Rate Limiting

Rate limiting is category-driven in `utils/rateLimit.ts`:

- `RATE_LIMIT_CONFIG` maps `Category -> table/timestamp/max/window`.
- `hasRateLimitConfig(category)` checks whether the category is configured.
- `rateLimitByCategory(...)` counts user records in configured time window and blocks when limit is reached.

## How To Add A New Category/Question

Use this checklist in order:

1. Add category enum value in `utils/habit-types.ts`. 
   Make sure it's string value matches the name of the table in the database.
2. Define input type for the new category (for example in `utils/<category>/types.ts`).
3. Extend `LogHabitRequest` to include the new category payload type.
4. Extend `parseLogHabitRequest(...)` with new branch returning typed object.
5. Add rate-limit config in `utils/rateLimit.ts` for the new category.
6. Create category module `utils/<category>/index.ts` with:
   - `calculate<Category>CO2(...)`
   - `store<Category>Result(...)`
   - `log<Category>Habit(...)` (call calculate then store)
7. Add dispatcher case in `utils/logHabitDispatcher.ts` to call `log<Category>Habit(...)`.
8. Verify DB schema/table/column names match both:
   - new category store function
   - rate-limit config table/timestamp

## Suggested Category Module Pattern

For each category, keep the same function split:

- `calculate...`: pure-ish domain calculation (input -> CO2 result)
- `store...`: persistence (Supabase insert/select)
- `log...`: orchestration called by dispatcher

This keeps each category independent and makes it easy to add more categories without changing endpoint flow.

## Suggested Improvements (Enforce Pattern With Types)

To make this architecture mandatory (not just a convention), define a shared `CategoryHandler` interface and register handlers in a typed map.

Recommended minimum contract per category handler:

- `parseInput(payload)` - validates and narrows raw payload for that category.
- `rateLimitConfig` - table, timestamp column, max requests, and time window.
- `calculateCO2(input)` - performs category-specific CO2 calculation.
- `storeResult(result, userId, supabase)` - persists final data in the correct table.
- `log(input, userId, supabase)` - orchestration helper (calculate + store).

The parse habit function and dispatch habit function should not return null. 
Instead, they should raise errors. 
