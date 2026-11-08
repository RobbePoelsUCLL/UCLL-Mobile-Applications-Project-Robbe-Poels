import { getDistanceMeters } from './locationService';
import type { Coordinates } from './locationService';

const VALHALLA_DEMO_URL = 'https://valhalla1.openstreetmap.de/route';

interface ValhallaLeg {
  shape?: string;
}

interface ValhallaResponse {
  trip?: {
    legs?: ValhallaLeg[];
  };
  error?: string;
  status?: string;
}

export async function getWalkingRoute(
  from: Coordinates,
  to: Coordinates,
): Promise<Coordinates[]> {
  const request = {
    locations: [
      { lat: from.latitude, lon: from.longitude },
      { lat: to.latitude, lon: to.longitude },
    ],
    costing: 'pedestrian',
    units: 'meters',
    shape_format: 'polyline6',
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(
      `${VALHALLA_DEMO_URL}?json=${encodeURIComponent(JSON.stringify(request))}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`Walking route service returned HTTP ${response.status}.`);
    }

    const result = await response.json() as ValhallaResponse;
    if (result.error) {
      throw new Error(`Could not calculate a walking route: ${result.error}`);
    }

    const shape = result.trip?.legs?.[0]?.shape;
    if (typeof shape !== 'string' || shape.length === 0) {
      throw new Error('The walking route service returned no route geometry.');
    }

    const route = decodePolyline6(shape);
    if (route.length < 2) {
      throw new Error('The walking route service returned an incomplete route.');
    }
    return route;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The walking route request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function decodePolyline6(encoded: string): Coordinates[] {
  const coordinates: Coordinates[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const decodeValue = () => {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      if (index >= encoded.length) {
        throw new Error('The walking route service returned malformed geometry.');
      }
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    return (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    latitude += decodeValue();
    longitude += decodeValue();
    coordinates.push({
      latitude: latitude / 1_000_000,
      longitude: longitude / 1_000_000,
    });
  }

  return coordinates;
}

export function getNearestRouteIndex(
  route: Coordinates[],
  position: Coordinates,
  minimumIndex: number,
): number {
  let nearestIndex = Math.min(minimumIndex, route.length - 1);
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = Math.max(0, minimumIndex); index < route.length; index += 1) {
    const distance = getDistanceMeters(position, route[index]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

export function getVisibleRouteEndIndex(
  route: Coordinates[],
  progressIndex: number,
  destination: Coordinates,
  distanceToDestination: number,
  arrivalRadiusMeters: number,
  maxLookAheadMeters: number,
): number {
  const availableLookAhead = Math.min(
    maxLookAheadMeters,
    Math.max(0, distanceToDestination - arrivalRadiusMeters),
  );
  let destinationBufferIndex = route.length - 1;
  for (let index = 0; index < route.length; index += 1) {
    if (getDistanceMeters(route[index], destination) <= arrivalRadiusMeters) {
      destinationBufferIndex = index - 1;
      break;
    }
  }

  let revealedDistance = 0;
  let endIndex = Math.max(-1, Math.min(progressIndex, destinationBufferIndex));

  while (endIndex < destinationBufferIndex && revealedDistance < availableLookAhead) {
    revealedDistance += getDistanceMeters(route[endIndex], route[endIndex + 1]);
    endIndex += 1;
  }

  return endIndex;
}
