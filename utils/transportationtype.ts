// utils/types.ts
export interface TransportationData {
    start: string;
    destination: string;
    transportMode: 'car' | 'bus' | 'train'| 'airplane'; // Begränsa till giltiga val
    userId: string;
  }