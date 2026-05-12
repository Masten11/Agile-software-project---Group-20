# Endpoint Overview

## `log-habit`

Accepts:

```json
{
  "category": "transport",
  "dayOffset": 0,
  "body": {
    "start": "Stockholm",
    "destination": "Uppsala",
    "transportMode": "train"
  }
}
```

Notes:

- `dayOffset` is validated by the backend
- `0` means today, `1` means yesterday
- the backend derives `day`
- the database sets `created_at`

Returns:

```json
{
  "success": true,
  "message": "Habit entry created.",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "category": "transport",
    "co2_kg": 1.23,
    "water_l": 0,
    "energy_kwh": 0,
    "details": {
      "start": "Stockholm",
      "destination": "Uppsala",
      "transportMode": "train",
      "distanceInKm": 70
    },
    "day": "2026-05-12",
    "created_at": "2026-05-12T10:15:30.000Z"
  }
}
```

## `unlog-habit`

Accepts:

```json
{
  "id": "uuid"
}
```

Returns:

```json
{
  "success": true,
  "message": "Entry removed."
}
```

## `logged-habits`

Accepts:

- `GET` request with no body

Returns grouped habits for the authenticated user for today. Each row follows the same row shape as `eco_activities`, including:

- `category`
- `co2_kg`
- `water_l`
- `energy_kwh`
- `details`
- `day`
- `created_at`

## `historical-data`

Historical endpoints should treat `day` as the calendar date a habit belongs to and `created_at` as the insertion timestamp.












