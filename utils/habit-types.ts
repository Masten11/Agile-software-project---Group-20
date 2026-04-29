export enum Category {
  Transportation = 'transport', //Add more categories here
}

export type LogHabitRequest = {
  category: Category.Transportation;
  body: TransportationInput ; //Here we add by union more input types
};


//Type for the emission row in the database
export type EmissionRow = {
  id: string;
  user_id: string;
  category: string;
  co2_kg: number;
  details: Record<string, unknown>;
  created_at: string;
};

/////////////////////////////
/// Input types for log-habit endpoint
////////////////////////////7

export type TransportMode = 'car' | 'bus' | 'train' | 'plane' | 'bike';

export interface TransportationInput {
  start: string;
  destination: string;
  transportMode: TransportMode; // Begränsa till giltiga val
}

/////////////////////////////
/// Input types for unlog-habit endpoint
////////////////////////////7
export type UnlogHabitRequest = {
  id: string;
};

