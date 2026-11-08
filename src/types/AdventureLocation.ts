import type { Theme } from './Theme';

export interface AdventureLocation {
  id: number;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  themes: Theme[];
}

export interface NearbyLocation extends Omit<AdventureLocation, 'latitude' | 'longitude'> {
  latitude: number;
  longitude: number;
  distanceMeters: number;
}
