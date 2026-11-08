export interface VisitedLocation {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  lastVisitedAt: string;
}
