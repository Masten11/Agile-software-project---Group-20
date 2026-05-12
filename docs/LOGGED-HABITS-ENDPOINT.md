# Logged Habits Endpoint

`GET /api/logged-habits` returns the authenticated user's logged habits for today, grouped by known category.

Main entrypoint: `app/api/logged-habits/route.ts`

## Request Lifecycle

1. **Auth**  
   Validate the authenticated user with `supabase.auth.getUser()`.
2. **Fetch**  
   Read rows from `view_today_habits` filtered by `user_id`.
3. **Validate + Group**  
   Validate each row category against the API contract, then group the rows by category.
4. **Respond**  
   Return an object with all known categories present.

## Data Source

The endpoint reads from `view_today_habits`, which exposes:

- `id`
- `user_id`
- `category`
- `co2_kg`
- `water_l`
- `energy_kwh`
- `details`
- `day`
- `created_at`

`day` is the calendar day the habit belongs to.  
`created_at` is the exact timestamp when the row was inserted.

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

- The endpoint always returns all known category keys, even when some arrays are empty.
- Unknown category rows are treated as schema drift and return `500`.
- The data source is already ordered within the day by `created_at DESC`.
