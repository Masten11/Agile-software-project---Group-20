//struktur för hur datan från databasen ser ut när den hämtas ut samt
//strukturen för datan som skickas till frontend. 



export type ActivityRow = {
    id: string;
    user_id: string;
    category: string;
    co2_kg: number;
    water_l: number;
    energy_kwh: number;
    details: Record<string, unknown>;
    created_at: string;
    day: string;
  };
  
  export type MetricStatus = 'ok' | 'borderline' | 'bad';
  
  export type MetricResult = {
    metric: 'co2' | 'water' | 'energy';
    total: number;
    unit: string;
    status: MetricStatus;
    top_category: string | null;
    tip: string | null;
  };