# Logged Habits Endpoint

`GET /api/logged-habits?dayOffset=0|1` returns the authenticated user's logged habits for the requested day, grouped by known category.

Main entrypoint: `app/api/logged-habits/route.ts`

## Query Parameters

- `dayOffset` (required): the number of days back from today to fetch.
  - `0` -> today
  - `1` -> yesterday
  - Any missing or invalid value returns `400`.

## Request Lifecycle

1. **Auth**
   Validate the authenticated user with `supabase.auth.getUser()`.
2. **Parse offset**
   Read `dayOffset` from the query string and validate it as `0` or `1`.
3. **Resolve day**
   Convert the offset to a `YYYY-MM-DD` date string via `resolveDayFromOffset`.
4. **Fetch**
   Read rows from `eco_activities` filtered by `user_id` and `day`.
5. **Group**
   Group the rows by category.
6. **Respond**
   Return an object with all known categories present.

## Response Contract

The response is grouped by known category keys:

```ts
type LoggedHabitsResponse = {
  transport: EcoActivityRow[];
  shower: EcoActivityRow[];
  dishwasher: EcoActivityRow[];
};
```

Each `EcoActivityRow` includes:

- `id`
- `user_id`
- `category`
- `co2_kg`
- `water_l`
- `energy_kwh`
- `details`
- `day`
- `created_at`

## Behavior Notes

- `dayOffset` is required; missing or invalid values return `400`.
- The endpoint always returns all known category keys, even when some arrays are empty.
- Unknown category rows are treated as schema drift and return `500`.
- Rows are returned ordered within the day by `created_at DESC`.
