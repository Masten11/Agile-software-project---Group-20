# Engaging App Backend API Contract Purpose
This document describes how the frontend should communicate with the Engaging App backend API.

# It explains:

- Which backend function/API endpoint to call
- Which JSON body must be sent
- What response the frontend receives
- How the frontend gets the generated comparison text
- Which Supabase views are required

-------------------------------------------------------------------------------------------------------------------------

# For the frontend:

1. Frontend must call the backend POST endpoint: /api/engaging
2. Frontend must send a POST request with JSON body. ex: {
  "user_id": "123",
  "category": "co2"
}
3. The categories must be one of: (co2, water, electricity)

Example using fetch:

const response = await fetch('/api/engaging', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: user.id,
    category: 'co2',
  }),
});

const data = await response.json();

4. Backend Response to the frontend:

ex: 
{
  "user_id": "123",
  "category": "co2",
  "total": 52,
  "total_unit": "kg_co2",
  "impact_value": 2.6,
  "impact_unit": "trees_per_year",
  "text": "It would take 2.6 trees one full year to absorb your CO₂ emissions from the last 7 days."
}

Frontend should primarily use the {"text":} part. This field already contains the fully generated engaging/comparison text.

Frontend can directly render: <p>{data.text}</p>

-----------------------------------------------------------------------------------------------------------------------------


# Required Supabase Views, The backend requires these three views to exist:

1. co2_last_7_days: 
   column: user_id, total_co2

2. water_last_7_days
    column: user_id, total_water

3. electricity_last_7_days
    column: user_id, total_electricity


The view must:

1. Filter rows for the last 7 days
2. Group the data by user_id
3. Sum the relevant value for each user
4. Return one row per user
5. Return the correct total column name expected by the backend

This is important because the backend expects the views to already contain the weekly totals.

The backend does not calculate the weekly sum itself.
The backend only reads the total from the correct view.