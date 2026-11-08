import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Coordinates } from '../services/locationService';
import type { VisitedLocation } from '../types/VisitedLocation';
import { colors } from '../theme';
import { Text } from './primitives/Text';

const TILE_SIZE = 256;
const TILE_URL = 'https://basemaps.cartocdn.com/rastertiles/voyager';
const CARTO_API_KEY = process.env.EXPO_PUBLIC_CARTO_BASEMAP_KEY;
const DEFAULT_CENTER: Coordinates = { latitude: 0, longitude: 0 };

interface MapSize {
  width: number;
  height: number;
}

interface MapTile {
  key: string;
  uri: string;
  left: number;
  top: number;
}

interface WorldPoint {
  x: number;
  y: number;
}

interface VisitedLocationsMapProps {
  locations: VisitedLocation[];
  isLoading: boolean;
  error: string | null;
  fullScreen?: boolean;
}

export function VisitedLocationsMap({
  locations,
  isLoading,
  error,
  fullScreen = false,
}: VisitedLocationsMapProps) {
  const [mapSize, setMapSize] = useState<MapSize>({ width: 0, height: 0 });
  const [center, setCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [currentLocationError, setCurrentLocationError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(14);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [tileError, setTileError] = useState(false);
  const fittedLocations = useRef('');
  const panStartWorldCenter = useRef<WorldPoint>({ x: 0, y: 0 });

  const locationsKey = locations.map((location) => location.id).join(',');
  const fittedLocationsKey = `${locationsKey}:${currentLocation ? 'with-current' : 'without-current'}`;

  useEffect(() => {
    let isMounted = true;
    let locationSubscription: Location.LocationSubscription | null = null;

    const loadCurrentLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (!permission.granted) {
          setCurrentLocationError('Allow location access to show your current position.');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!isMounted) return;
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
          },
          (updatedPosition) => {
            if (!isMounted) return;
            setCurrentLocation({
              latitude: updatedPosition.coords.latitude,
              longitude: updatedPosition.coords.longitude,
            });
          },
        );
        if (isMounted) {
          locationSubscription = subscription;
        } else {
          subscription.remove();
        }
      } catch (locationError) {
        if (!isMounted) return;
        setCurrentLocationError(
          locationError instanceof Error
            ? `Could not get your current location: ${locationError.message}`
            : 'Could not get your current location.',
        );
      }
    };

    void loadCurrentLocation();

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (
      isLoading ||
      (!locations.length && !currentLocation) ||
      !mapSize.width ||
      !mapSize.height ||
      fittedLocations.current === fittedLocationsKey
    ) {
      return;
    }

    const coordinates = currentLocation
      ? [...locations, currentLocation]
      : locations;
    const fitted = fitLocations(coordinates, mapSize);
    setCenter(fitted.center);
    setZoom(fitted.zoom);
    setSelectedLocationId(null);
    fittedLocations.current = fittedLocationsKey;
  }, [
    currentLocation,
    fittedLocationsKey,
    isLoading,
    locations,
    mapSize,
  ]);

  const worldCenter = toWorldPixels(center, zoom);
  const worldCenterRef = useRef(worldCenter);
  worldCenterRef.current = worldCenter;
  const tiles = CARTO_API_KEY && (locations.length > 0 || currentLocation) && mapSize.width > 0 && mapSize.height > 0
    ? getTiles(worldCenter, mapSize, zoom)
    : [];
  const visibleLocations = locations
    .map((location) => {
      const worldPoint = toWorldPixels(location, zoom);
      return {
        location,
        x: worldPoint.x - worldCenter.x + mapSize.width / 2,
        y: worldPoint.y - worldCenter.y + mapSize.height / 2,
      };
    })
    .filter(({ x, y }) => x >= -20 && x <= mapSize.width + 20 && y >= -20 && y <= mapSize.height + 20);
  const currentLocationPoint = currentLocation
    ? toWorldPixels(currentLocation, zoom)
    : null;
  const currentLocationPosition = currentLocationPoint
    ? {
        x: currentLocationPoint.x - worldCenter.x + mapSize.width / 2,
        y: currentLocationPoint.y - worldCenter.y + mapSize.height / 2,
      }
    : null;
  const isCurrentLocationVisible = currentLocationPosition !== null &&
    currentLocationPosition.x >= -20 &&
    currentLocationPosition.x <= mapSize.width + 20 &&
    currentLocationPosition.y >= -20 &&
    currentLocationPosition.y <= mapSize.height + 20;
  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        panStartWorldCenter.current = worldCenterRef.current;
      },
      onPanResponderMove: (_event, gesture) => {
        setPanOffset({
          x: gesture.dx,
          y: gesture.dy,
        });
      },
      onPanResponderRelease: (_event, gesture) => {
        const nextWorldCenter = {
          x: panStartWorldCenter.current.x - gesture.dx,
          y: panStartWorldCenter.current.y - gesture.dy,
        };
        setCenter(fromWorldPixels(nextWorldCenter, zoom));
        setPanOffset({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => setPanOffset({ x: 0, y: 0 }),
    }),
    [zoom],
  );

  const handleZoom = (change: number) => {
    const nextZoom = Math.max(4, Math.min(19, zoom + change));
    if (nextZoom === zoom) return;

    const centerAtNextZoom = toWorldPixels(center, nextZoom);
    setZoom(nextZoom);
    setCenter(fromWorldPixels(centerAtNextZoom, nextZoom));
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <View
      style={[styles.map, fullScreen && styles.mapFullScreen]}
      {...panResponder.panHandlers}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setMapSize((current) =>
          current.width === width && current.height === height
            ? current
            : { width, height },
        );
      }}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          onError={() => setTileError(true)}
          resizeMode="stretch"
          fadeDuration={0}
          style={[
            styles.tile,
            {
              left: tile.left + panOffset.x,
              top: tile.top + panOffset.y,
            },
          ]}
        />
      ))}

      <Svg
        width={mapSize.width}
        height={mapSize.height}
        style={[styles.markerOverlay, { transform: [{ translateX: panOffset.x }, { translateY: panOffset.y }] }]}
        pointerEvents="none"
      >
        {visibleLocations.map(({ location, x, y }) => (
          <Circle
            key={`halo-${location.id}`}
            cx={x}
            cy={y}
            r={selectedLocationId === location.id ? 17 : 14}
            fill={colors.accent}
            opacity={0.2}
          />
        ))}
        {isCurrentLocationVisible && currentLocationPosition && (
          <>
            <Circle
              cx={currentLocationPosition.x}
              cy={currentLocationPosition.y}
              r={17}
              fill="#3478F6"
              opacity={0.2}
            />
            <Circle
              cx={currentLocationPosition.x}
              cy={currentLocationPosition.y}
              r={9}
              fill="#FFFFFF"
            />
            <Circle
              cx={currentLocationPosition.x}
              cy={currentLocationPosition.y}
              r={6}
              fill="#3478F6"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
          </>
        )}
      </Svg>

      {visibleLocations.map(({ location, x, y }) => (
        <Pressable
          key={location.id}
          accessibilityRole="button"
          accessibilityLabel={`Visited ${location.name}`}
          accessibilityState={{ selected: selectedLocationId === location.id }}
          onPress={() => setSelectedLocationId(location.id)}
          style={[
            styles.marker,
            {
              left: x - 15 + panOffset.x,
              top: y - 25 + panOffset.y,
            },
            selectedLocationId === location.id && styles.markerSelected,
          ]}
        >
          <Ionicons name="location" size={23} color={colors.surface} />
        </Pressable>
      ))}

      {(error || currentLocationError || (!CARTO_API_KEY && (locations.length > 0 || currentLocation)) || tileError) && (
        <View style={styles.mapMessage}>
          <Text size="sm" color={colors.textSecondary} align="center">
            {error
              ? error
              : currentLocationError
              ? currentLocationError
              : !CARTO_API_KEY && (locations.length > 0 || currentLocation)
              ? 'Add EXPO_PUBLIC_CARTO_BASEMAP_KEY to your local .env file to load map tiles.'
              : 'Map tiles could not be loaded. Check your CARTO basemap key and connection.'}
          </Text>
        </View>
      )}

      {!fullScreen && !isLoading && !error && !currentLocation && locations.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="map-outline" size={22} color={colors.accent} />
          </View>
          <Text size="sm" weight="bold" color={colors.text} align="center">Your map is ready to fill</Text>
          <Text size="sm" color={colors.textSecondary} align="center">
            Locations you visit will appear here.
          </Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingLabel}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text size="sm" weight="medium" color={colors.text}>Loading visited places</Text>
        </View>
      )}

      {selectedLocation && (
        <View style={[styles.locationCard, fullScreen && styles.locationCardFullScreen]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close place details"
            onPress={() => setSelectedLocationId(null)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={17} color={colors.textSecondary} />
          </Pressable>
          <Text size="sm" weight="bold" color={colors.accent}>VISITED PLACE</Text>
          <Text size="md" weight="bold" color={colors.text}>{selectedLocation.name}</Text>
          <Text size="sm" color={colors.textSecondary}>
            {selectedLocation.description ?? 'No description available.'}
          </Text>
        </View>
      )}

      <View style={[styles.zoomControls, fullScreen && styles.zoomControlsFullScreen]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          onPress={() => handleZoom(1)}
          style={styles.zoomButton}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.zoomDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          onPress={() => handleZoom(-1)}
          style={styles.zoomButton}
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.attribution}>
        <Text size="sm" color={colors.text}>© OpenStreetMap contributors, © CARTO</Text>
      </View>
    </View>
  );
}

function fitLocations(locations: Coordinates[], mapSize: MapSize) {
  if (locations.length === 1) {
    return { center: locations[0], zoom: 15 };
  }

  const pointsAtMaxZoom = locations.map((location) => toWorldPixels(location, 16));
  const minX = Math.min(...pointsAtMaxZoom.map((point) => point.x));
  const maxX = Math.max(...pointsAtMaxZoom.map((point) => point.x));
  const minY = Math.min(...pointsAtMaxZoom.map((point) => point.y));
  const maxY = Math.max(...pointsAtMaxZoom.map((point) => point.y));
  const midpoint = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
  const availableWidth = Math.max(80, mapSize.width - 80);
  const availableHeight = Math.max(80, mapSize.height - 80);
  let zoom = 4;

  for (let candidate = 16; candidate >= 4; candidate -= 1) {
    const zoomFactor = 2 ** (candidate - 16);
    const boundsFit =
      (maxX - minX) * zoomFactor <= availableWidth &&
      (maxY - minY) * zoomFactor <= availableHeight;
    if (boundsFit) {
      zoom = candidate;
      break;
    }
  }

  return {
    center: fromWorldPixels(midpoint, 16),
    zoom,
  };
}

function toWorldPixels(coordinate: Coordinates, zoom: number) {
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, coordinate.latitude));
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin(latitude * Math.PI / 180);

  return {
    x: (coordinate.longitude + 180) / 360 * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

function fromWorldPixels(point: WorldPoint, zoom: number): Coordinates {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = point.x / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * point.y / scale;
  const latitude = 180 / Math.PI * Math.atan(Math.sinh(n));

  return { latitude, longitude };
}

function getTiles(worldCenter: { x: number; y: number }, size: MapSize, zoom: number): MapTile[] {
  const tileCount = 2 ** zoom;
  const minTileX = Math.floor((worldCenter.x - size.width / 2) / TILE_SIZE);
  const maxTileX = Math.floor((worldCenter.x + size.width / 2) / TILE_SIZE);
  const minTileY = Math.floor((worldCenter.y - size.height / 2) / TILE_SIZE);
  const maxTileY = Math.floor((worldCenter.y + size.height / 2) / TILE_SIZE);
  const tiles: MapTile[] = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tileCount) continue;

      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}/${wrappedTileX}/${tileY}`,
        uri: `${TILE_URL}/${zoom}/${wrappedTileX}/${tileY}.png?key=${encodeURIComponent(CARTO_API_KEY ?? '')}`,
        left: tileX * TILE_SIZE - worldCenter.x + size.width / 2,
        top: tileY * TILE_SIZE - worldCenter.y + size.height / 2,
      });
    }
  }

  return tiles;
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    overflow: 'hidden',
    borderRadius: 21,
    backgroundColor: '#E8E4D9',
  },
  mapFullScreen: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  markerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    elevation: 3,
  },
  zoomControlsFullScreen: {
    top: 16,
    height: 74,
  },
  markerSelected: {
    backgroundColor: '#C17C48',
    transform: [{ scale: 1.12 }],
  },
  mapMessage: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  emptyState: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 35,
    backgroundColor: '#F1EFE6',
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1EBDD',
    marginBottom: 3,
  },
  loadingLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  locationCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 33,
    gap: 3,
    padding: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.97)',
    elevation: 4,
  },
  locationCardFullScreen: {
    bottom: 120,
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    bottom: 36,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    elevation: 3,
  },
  zoomButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  attribution: {
    position: 'absolute',
    right: 4,
    bottom: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
