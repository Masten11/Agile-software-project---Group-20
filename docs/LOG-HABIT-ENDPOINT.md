# Log Habit Endpoint

This document explains how `POST /api/log-habit` validates a habit log request and stores it in `eco_activities`.

Main entrypoint: `app/api/log-habit/route.ts`

## Request Contract

The endpoint accepts a top-level payload shaped like this:

```ts
type DayOffset = 0 | 1;

type LogHabitRequest = {
  category: Category;
  dayOffset: DayOffset;
  body: unknown;
};
```

`dayOffset` is the only date input sent by the frontend:

- `0` = today
- `1` = yesterday

Any other value is rejected with `400`.

Example request:

```json
{
  "category": "transport",
  "dayOffset": 1,
  "body": {
    "start": "Stockholm",
    "destination": "Uppsala",
    "transportMode": "train"
  }
}
```

## Stored Date Fields

`eco_activities` stores two separate time concepts:

- `day`: the business day the habit belongs to, stored as `YYYY-MM-DD`
- `created_at`: the exact timestamp when the row was inserted

The backend derives `day` from the validated `dayOffset`. `created_at` is left to the database default.

## Request Lifecycle

1. **Auth**  
   Create the Supabase client and verify the authenticated user.
2. **Parse top-level request**  
   `parseLogHabitRequest(...)` validates `{ category, dayOffset, body }`.
3. **Resolve day**  
   The route converts `dayOffset` into the canonical `day` string.
4. **Handler lookup**  
   `getHabitHandler(payload.category)` returns the category-specific handler.
5. **Parse category body**  
   `handler.parse(payload.body)` validates and narrows the category input.
6. **Calculate metrics**  
   `handler.calculate(parsed)` computes `co2_kg`, `water_l`, `energy_kwh`, and any extra details.
7. **Store**  
   `handler.store(...)` inserts into `eco_activities` with the resolved `day`.
8. **Respond**  
   The route returns `201` with the saved row.

## Response Shape

Successful requests return:

```ts
type LogHabitSuccessResponse = {
  success: true;
  message: "Habit entry created.";
  data: {
    id: string;
    user_id: string;
    category: string;
    co2_kg: number;
    water_l: number;
    energy_kwh: number;
    details: Record<string, unknown>;
    day: string;
    created_at: string;
  };
};
```

## Supported Categories

Current supported categories live in `utils/habit-types.ts`:

- `transport`
- `shower`
- `dishwasher`

Handlers are registered in `utils/habit-handlers.ts`.

## Type Safety Contract

Type safety is centralized in:

- `utils/habit-types.ts`
- `utils/payload_parsing.ts`
- `utils/categories/*.ts`

The contract is:

- top-level request validation happens once
- category-specific validation happens in the chosen handler
- metrics are calculated before persistence
- persistence receives a backend-resolved `day`, never a raw client date string

## Adding A New Category

1. Add the category enum value in `utils/habit-types.ts`.
2. Implement `parse`, `calculate`, and `store` in `utils/categories/<category>.ts`.
3. Register the handler in `utils/habit-handlers.ts`.
4. Ensure the stored row matches `eco_activities` (`day` + `created_at`, not client-supplied timestamps).
