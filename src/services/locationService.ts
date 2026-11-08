import { supabase } from '../lib/supabase';
import type { AdventureLocation, NearbyLocation } from '../types/AdventureLocation';
import type { VisitedLocation } from '../types/VisitedLocation';
import type { Theme } from '../types/Theme';

interface ThemeRow {
  id: number;
  name: string | null;
  description: string | null;
}

interface LocationRow {
  id: number;
  name: string;
  description: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  locations_themes: Array<{ themes: ThemeRow | ThemeRow[] | null }> | null;
}

interface LocationWithCoordinates extends AdventureLocation {
  latitude: number;
  longitude: number;
}

interface VisitRow {
  visited_at: string;
  locations: {
    id: number;
    name: string;
    description: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  } | Array<{
    id: number;
    name: string;
    description: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
  }> | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

function mapTheme(row: ThemeRow): Theme {
  if (row.name === null) {
    throw new Error(`Theme ${row.id} is missing its required name.`);
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
  };
}

function parseCoordinate(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapLocation(row: LocationRow): AdventureLocation {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    latitude: parseCoordinate(row.latitude),
    longitude: parseCoordinate(row.longitude),
    themes: (row.locations_themes ?? [])
      .flatMap(({ themes }) => {
        if (themes === null) return [];
        return (Array.isArray(themes) ? themes : [themes]).map(mapTheme);
      }),
  };
}

export async function getThemes(): Promise<Theme[]> {
  const { data, error } = await supabase
    .from('themes')
    .select('id,name,description')
    .order('name');

  if (error) throw new Error(`Could not load themes: ${error.message}`);
  return (data as ThemeRow[]).map(mapTheme);
}

export async function getVisitedLocations(userId: string): Promise<VisitedLocation[]> {
  const { data, error } = await supabase
    .from('visits')
    .select('visited_at,locations(id,name,description,latitude,longitude)')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false });

  if (error) throw new Error(`Could not load visited locations: ${error.message}`);

  const visits = data as VisitRow[];
  const locationsById = new Map<number, VisitedLocation>();

  for (const visit of visits) {
    const relatedLocation = Array.isArray(visit.locations)
      ? visit.locations[0]
      : visit.locations;
    if (!relatedLocation) continue;

    const latitude = parseCoordinate(relatedLocation.latitude);
    const longitude = parseCoordinate(relatedLocation.longitude);
    if (
      latitude === null ||
      longitude === null ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      continue;
    }

    if (!locationsById.has(relatedLocation.id)) {
      locationsById.set(relatedLocation.id, {
        id: relatedLocation.id,
        name: relatedLocation.name,
        description: relatedLocation.description,
        latitude,
        longitude,
        lastVisitedAt: visit.visited_at,
      });
    }
  }

  return Array.from(locationsById.values());
}

export async function getRandomNearbyLocation(
  origin: Coordinates,
  themeIds: number[],
  maxDistanceMeters: number,
): Promise<NearbyLocation | null> {
  if (themeIds.length === 0) {
    throw new Error('Choose at least one theme to find a location.');
  }

  const { data, error } = await supabase
    .from('locations')
    .select('id,name,description,latitude,longitude,locations_themes(themes(id,name,description))');

  if (error) throw new Error(`Could not load locations: ${error.message}`);

  const selectedThemeIds = new Set(themeIds);
  const locationsWithCoordinates = (data as LocationRow[])
    .map(mapLocation)
    .filter((location): location is LocationWithCoordinates =>
      location.latitude !== null &&
      location.longitude !== null &&
      Math.abs(location.latitude) <= 90 &&
      Math.abs(location.longitude) <= 180,
    )
    .filter((location) => location.themes.some((theme) => selectedThemeIds.has(theme.id)));

  const matches = locationsWithCoordinates
    .map((location) => ({
      ...location,
      distanceMeters: getDistanceMeters(origin, {
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    }))
    .filter((location) => location.distanceMeters <= maxDistanceMeters);

  if (matches.length === 0) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}

export function getDistanceMeters(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getBearingDegrees(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeFrom = radians(from.latitude);
  const latitudeTo = radians(to.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(latitudeTo);
  const x =
    Math.cos(latitudeFrom) * Math.sin(latitudeTo) -
    Math.sin(latitudeFrom) * Math.cos(latitudeTo) * Math.cos(longitudeDelta);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function getCardinalDirection(bearingDegrees: number): string {
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return directions[Math.round(bearingDegrees / 45) % directions.length];
}

export function getRelativeBearingDegrees(bearingDegrees: number, headingDegrees: number): number {
  return ((bearingDegrees - headingDegrees + 540) % 360) - 180;
}

export function getTurnInstruction(relativeBearingDegrees: number): string {
  if (Math.abs(relativeBearingDegrees) < 15) return 'straight ahead';
  return relativeBearingDegrees > 0 ? 'turn right' : 'turn left';
}
