# Historical Data Endpoint

`GET /api/historical-data` returns aggregated historical metrics for the authenticated user.

Main entrypoint: `app/api/historical-data/route.ts`

## Request Contract

The endpoint accepts:

- a `GET` request
- no request body
- no query parameters

The authenticated user is resolved from the Supabase session on the server.

## Response Contract

The response is grouped by metric:

Example response:

```json
{
  "co2_kg": {
    "daily": 2.35,
    "weekly": [
      { "day": "Wed", "total": 0 },
      { "day": "Thu", "total": 0.42 },
      { "day": "Fri", "total": 0 },
      { "day": "Sat", "total": 1.1 },
      { "day": "Sun", "total": 0 },
      { "day": "Mon", "total": 0.83 },
      { "day": "Tue", "total": 2.35 }
    ],
    "monthly": [
      { "week": "Week 1", "total": 3.4 },
      { "week": "Week 2", "total": 1.8 },
      { "week": "Week 3", "total": 4.12 },
      { "week": "Week 4", "total": 2.35 }
    ],
    "yearly": [
      { "month": "Jan", "total": 12.4 },
      { "month": "Feb", "total": 9.7 },
      { "month": "Mar", "total": 14.2 }
    ]
  },
  "water_l": {
   //Same as co2 
  },
  "energy_kwh": {
    //Same as co2
  }
}
```

## Request Lifecycle

1. **Auth**  
   Validate the authenticated user with `supabase.auth.getUser()`.
2. **Resolve fetch window**  
   Compute the earliest date needed to cover both the last 7 days and the current year.
3. **Fetch raw activity rows**  
   Read `day`, `co2_kg`, `water_l`, and `energy_kwh` from `eco_activities` for the current user.
4. **Build time ranges**  
   Generate labels for:
   - the last 7 days
   - all week buckets in the current month
   - all months in the current year
5. **Aggregate per metric**  
   Build `daily`, `weekly`, `monthly`, and `yearly` totals for each metric.
6. **Respond**  
   Return a JSON object with `co2_kg`, `water_l`, and `energy_kwh`.

## Time Window Semantics

- `daily` is today's total for the metric.
- `weekly` is a 7-point daily series for the last 7 calendar days, with today last.
- `monthly` is grouped by week buckets for the current month.
- `yearly` is grouped by month for the current calendar year.

## Data Source Notes

The endpoint reads from `eco_activities` and uses:

- `day` as the calendar date the activity belongs to
- `co2_kg` as the CO2 metric
- `water_l` as the water metric
- `energy_kwh` as the energy metric

`day` is normalized to `YYYY-MM-DD` before aggregation.

## Precision Rules

- `co2_kg` totals are rounded to 2 decimals.
- `water_l` totals are rounded to 1 decimal.
- `energy_kwh` totals are rounded to 2 decimals.

## Error Behavior

- Returns `401` with `{ "error": "you have not logged in" }` when no authenticated user is present.
- Returns `500` with `{ "error": "<message>" }` when the database query or aggregation flow fails.
