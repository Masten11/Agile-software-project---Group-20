### Response format
```json
{
  "tips": [
    {
      "metric": "co2",
      "total": 87.3,
      "unit": "kg",
      "status": "borderline",
      "top_category": "transport",
      "tip": "Driving is your biggest CO₂ source this week..."
    },
    {
      "metric": "water",
      "total": 420,
      "unit": "liter",
      "status": "borderline",
      "top_category": "shower",
      "tip": "You used 420 liters this week..."
    },
    {
      "metric": "energy",
      "total": 15.2,
      "unit": "kWh",
      "status": "ok",
      "top_category": "dishwasher",
      "tip": null
    }
  ]
}
```

### How to get each tip
```ts
const res = await fetch('/api/weekly-tip');
const { tips } = await res.json();

const co2Tip    = tips.find(t => t.metric === 'co2');
const waterTip  = tips.find(t => t.metric === 'water');
const energyTip = tips.find(t => t.metric === 'energy');

// tip is null if usage is within healthy limits
```