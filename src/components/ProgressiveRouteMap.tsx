import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import type { Coordinates } from '../services/locationService';
import { colors } from '../theme';
import { Text } from './primitives/Text';

const TILE_SIZE = 256;
const ZOOM_LEVEL = 16;
const TILE_URL = 'https://basemaps.cartocdn.com/rastertiles/voyager';
const CARTO_API_KEY = process.env.EXPO_PUBLIC_CARTO_BASEMAP_KEY;

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

interface ProgressiveRouteMapProps {
  center: Coordinates;
  route: Coordinates[];
}

export function ProgressiveRouteMap({ center, route }: ProgressiveRouteMapProps) {
  const [mapSize, setMapSize] = useState<MapSize>({ width: 0, height: 0 });
  const [tileError, setTileError] = useState(false);

  const worldCenter = toWorldPixels(center, ZOOM_LEVEL);
  const tiles = CARTO_API_KEY && mapSize.width > 0 && mapSize.height > 0
    ? getTiles(worldCenter, mapSize)
    : [];
  const routePoints = route
    .map((coordinate) => {
      const worldPoint = toWorldPixels(coordinate, ZOOM_LEVEL);
      const x = worldPoint.x - worldCenter.x + mapSize.width / 2;
      const y = worldPoint.y - worldCenter.y + mapSize.height / 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View
      style={styles.map}
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
          style={[styles.tile, { left: tile.left, top: tile.top }]}
        />
      ))}
      {(!CARTO_API_KEY || tileError) && (
        <View style={styles.mapMessage}>
          <Text size="sm" color={colors.textSecondary} align="center">
            {!CARTO_API_KEY
              ? 'Add EXPO_PUBLIC_CARTO_BASEMAP_KEY to your local .env file to load map tiles.'
              : 'Map tiles could not be loaded. Check your CARTO basemap key and connection.'}
          </Text>
        </View>
      )}
      <Svg width={mapSize.width} height={mapSize.height} style={styles.routeOverlay}>
        {route.length > 1 && (
          <>
            <Polyline
              points={routePoints}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={9}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Polyline
              points={routePoints}
              fill="none"
              stroke={colors.accent}
              strokeWidth={5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}
        <Circle
          cx={mapSize.width / 2}
          cy={mapSize.height / 2}
          r={13}
          fill="#FFFFFF"
          opacity={0.9}
        />
        <Circle
          cx={mapSize.width / 2}
          cy={mapSize.height / 2}
          r={8}
          fill="#3879D9"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </Svg>
      <View style={styles.currentLocationLabel}>
        <View style={styles.currentLocationDot} />
        <Text size="sm" weight="bold" color={colors.text}>YOU ARE HERE</Text>
      </View>
      <View style={styles.attribution}>
        <Text size="sm" color={colors.text}>© OpenStreetMap contributors, © CARTO</Text>
      </View>
    </View>
  );
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

function getTiles(worldCenter: { x: number; y: number }, size: MapSize): MapTile[] {
  const tileCount = 2 ** ZOOM_LEVEL;
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
        key: `${ZOOM_LEVEL}/${wrappedTileX}/${tileY}`,
        uri: `${TILE_URL}/${ZOOM_LEVEL}/${wrappedTileX}/${tileY}.png?key=${encodeURIComponent(CARTO_API_KEY ?? '')}`,
        left: tileX * TILE_SIZE - worldCenter.x + size.width / 2,
        top: tileY * TILE_SIZE - worldCenter.y + size.height / 2,
      });
    }
  }

  return tiles;
}

const styles = StyleSheet.create({
  map: {
    height: 290,
    overflow: 'hidden',
    borderRadius: 21,
    backgroundColor: '#E8E4D9',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  routeOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  currentLocationLabel: {
    position: 'absolute',
    top: 11,
    left: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  mapMessage: {
    position: 'absolute',
    top: 55,
    left: 18,
    right: 18,
    zIndex: 1,
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3879D9',
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
