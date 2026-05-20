# Historical Data Endpoint

`GET /api/historical-data` returns aggregated historical metrics for the authenticated user.

Main entrypoint: `app/api/historical-data/route.ts`  
Aggregation logic: `lib/historical-metrics.ts`

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
      { "week": "Week 4", "total": 2.35 },
      { "week": "Week 5", "total": 2.35 }
    ],
    "yearly": [
      { "month": "Jan", "total": 12.4 },
      { "month": "Feb", "total": 9.7 },
      { "month": "Mar", "total": 14.2 }
    ]
  },
  "water_l": {},
  "energy_kwh": {},
  "eco_score": {}
}
```

(`water_l`, `energy_kwh`, and `eco_score` use the same shape as `co2_kg`.)

## Request Lifecycle

1. **Auth**  
   Validate the authenticated user with `supabase.auth.getUser()`.
2. **Resolve fetch window**  
   Compute `fromDate` as the earliest date needed for the last 7 days, 5 rolling weeks, and the current calendar year.
3. **Fetch raw rows (parallel)**  
   - `eco_activities`: `day`, `co2_kg`, `water_l`, `energy_kwh`  
   - `eco_score_log`: `day`, `score`  
   Optionally fetch one prior `eco_score_log` row before `fromDate` to seed carry-forward at range edges.
4. **Build time ranges**  
   - last 7 calendar days (oldest first, today last)  
   - 5 rolling week buckets ending at the current week  
   - all 12 months in the current year (Jan–Dec)
5. **Aggregate per metric**  
   Run each metric through `daily`, `weekly`, `monthly`, and `yearly` pipelines (`sum` for activities, `latest_value` with carry-forward for `eco_score`).
6. **Respond**  
   Return JSON with `co2_kg`, `water_l`, `energy_kwh`, and `eco_score`.

## Time Window Semantics

- `daily` is today's value for the metric.
- `weekly` is a 7-point daily series for the last 7 calendar days, **oldest first, today last**.
- `monthly` is 5 rolling week buckets (`Week 1` … `Week 5`), oldest week first; the current week is `Week 5`.
- `yearly` is grouped by month for the **current calendar year** (Jan–Dec). Months with no data use `0` for sum metrics. Future months (after the current month) are always `0` for `eco_score` — carry-forward does not extend into them.

All series are ordered chronologically (earliest bucket first).

## Data Source Notes

**`eco_activities`** (CO₂, water, energy):

- `day` — calendar date the activity belongs to
- `co2_kg`, `water_l`, `energy_kwh` — metric fields

**`eco_score_log`** (`eco_score`):

- `day` — calendar date for the score snapshot
- `score` — integer eco score (one row per user per day)

`day` is normalized to `YYYY-MM-DD` before aggregation.

## Aggregation Rules

| Metric | Strategy | Empty bucket |
|--------|----------|--------------|
| `co2_kg`, `water_l`, `energy_kwh` | Sum of values in bucket | `0` |
| `eco_score` | Latest value in bucket (max `day` in range) | Carry forward last known score in processing order for past and current months only; future months stay `0`; if none yet, `0` |

Carry-forward applies within each series in chronological order. A prior `eco_score_log` row before `fromDate` may seed the first bucket when present.

## Precision Rules

- `co2_kg` totals are rounded to 2 decimals.
- `water_l` totals are rounded to 1 decimal.
- `energy_kwh` totals are rounded to 2 decimals.
- `eco_score` values are integers (no fractional rounding).

## Error Behavior

- Returns `401` with `{ "error": "you have not logged in" }` when no authenticated user is present.
- Returns `500` with `{ "error": "<message>" }` when the database query or aggregation flow fails.
