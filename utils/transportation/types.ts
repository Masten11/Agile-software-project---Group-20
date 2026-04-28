export type TransportMode = 'car' | 'bus' | 'train' | 'plane' | 'bike';

export interface TransportationInput {
  start: string;
  destination: string;
  transportMode: TransportMode; // Begränsa till giltiga val
}
