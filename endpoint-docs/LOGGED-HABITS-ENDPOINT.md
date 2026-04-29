# Logged Habits Endpoint

`GET /api/logged-habits` returns the authenticated user's emission entries logged during the current date, grouped by category.

Main entrypoint: `app/api/logged-habits/route.ts`

## Request Lifecycle

1. **Auth**  
   Validate authenticated user with `supabase.auth.getUser()`.
2. **Fetch**  
   Read rows from `view_today_details` filtered by `user_id`.
3. **Validate + Group**  
   Validate every row category against known API categories, then group rows by category key.
4. **Respond**  
   Return grouped object with all known categories present.

## Data Source

Uses view `view_today_details` described in `database.md`.

Selected columns:

- `id`
- `user_id`
- `category`
- `co2_kg`
- `details`
- `created_at`

## Response Contract

Current response shape:

- `{ transport: EmissionRow[] }`

Behavior details:

- Always includes `transport` key, even when no rows exist for today (`transport: []`).
- Throws an error if any row category is unknown to the API contract.
- Unknown category mismatch returns `500` to surface schema/category drift quickly.
