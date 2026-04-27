// utils/types.ts
export interface TransportationData {
    start: string;
    destination: string;
    transportMode: 'car' | 'bus' | 'train'| 'plane'|'bike'; // Begränsa till giltiga val
    userId: string;
}




