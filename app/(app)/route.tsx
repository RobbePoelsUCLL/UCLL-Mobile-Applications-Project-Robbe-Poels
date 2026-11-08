import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { PageShell } from '../../src/components/PageShell';
import { LocationGuide } from '../../src/components/LocationGuide';
import { Text } from '../../src/components/primitives/Text';
import { getRandomNearbyLocation, getThemes } from '../../src/services';
import type { NearbyLocation, Theme } from '../../src/types';
import { colors } from '../../src/theme';

const distances = [
  { label: '500 m', meters: 500 },
  { label: '2 km', meters: 2_000 },
  { label: '5 km', meters: 5_000 },
  { label: '10 km', meters: 10_000 },
  { label: '50 km', meters: 50_000 },
];

const themeColors = ['#347A4E', '#6878A5', '#C37E3D', '#AD6681', '#548A8A', '#8A704F'];

export default function RouteSetupScreen() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<number[]>([]);
  const [selectedDistance, setSelectedDistance] = useState(5_000);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [destination, setDestination] = useState<NearbyLocation | null>(null);
  const [startingPosition, setStartingPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    getThemes()
      .then((loadedThemes) => {
        if (!isMounted) return;
        setThemes(loadedThemes);
        const defaultTheme = loadedThemes.find((theme) => theme.name.toLowerCase() === 'nature')
          ?? loadedThemes[0];
        if (defaultTheme) setSelectedThemeIds([defaultTheme.id]);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setThemeError(error instanceof Error ? error.message : 'Could not load themes.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingThemes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = (themeId: number) => {
    setSelectedThemeIds((current) =>
      current.includes(themeId)
        ? current.filter((id) => id !== themeId)
        : [...current, themeId],
    );
    setDestination(null);
    setDiscoveryError(null);
  };

  const handleFindLocation = async () => {
    setDiscoveryError(null);
    setDestination(null);

    if (selectedThemeIds.length === 0) {
      setDiscoveryError('Choose at least one theme to find a location.');
      return;
    }

    setIsFindingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setDiscoveryError(
          'Location access is needed to find nearby places. Allow location access in your device settings and try again.',
        );
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const currentCoordinates = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      const nearbyLocation = await getRandomNearbyLocation(
        currentCoordinates,
        selectedThemeIds,
        selectedDistance,
      );

      if (nearbyLocation === null) {
        setDiscoveryError(
          'No matching places found within this distance. Try another theme or a wider range.',
        );
        return;
      }

      setStartingPosition({
        ...currentCoordinates,
        accuracy: currentPosition.coords.accuracy,
      });
      setDestination(nearbyLocation);
    } catch (error) {
      setDiscoveryError(
        error instanceof Error ? error.message : 'Could not find a nearby place. Please try again.',
      );
    } finally {
      setIsFindingLocation(false);
    }
  };

  if (destination !== null && startingPosition !== null) {
    return (
      <LocationGuide
        destination={destination}
        startingPosition={startingPosition}
        onCancel={() => {
          setDestination(null);
          setStartingPosition(null);
        }}
      />
    );
  }

  return (
    <PageShell>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to map"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>

      <View style={styles.heading}>
        <Text size="sm" weight="bold" color={colors.accent}>YOUR NEXT ADVENTURE</Text>
        <Text size="xl" weight="bold" color={colors.text}>Where will you wander?</Text>
        <Text size="md" color={colors.textSecondary}>
          Pick a mood and a distance. We’ll keep the destination a surprise.
        </Text>
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text size="lg" weight="bold" color={colors.text}>Choose your themes</Text>
          <Text size="sm" color={colors.textSecondary}>Select one or more</Text>
        </View>
        <Ionicons name="sparkles" size={20} color="#D59642" />
      </View>

      {isLoadingThemes ? (
        <View style={styles.themeMessage}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text size="sm" color={colors.textSecondary}>Loading themes…</Text>
        </View>
      ) : themeError ? (
        <View style={styles.errorCard} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color="#A74B42" />
          <Text size="sm" color="#8F3F37">{themeError}</Text>
        </View>
      ) : themes.length === 0 ? (
        <View style={styles.themeMessage}>
          <Text size="sm" color={colors.textSecondary}>No themes are available yet.</Text>
        </View>
      ) : (
        <View style={styles.themeGrid}>
          {themes.map((theme, index) => {
            const selected = selectedThemeIds.includes(theme.id);
            const themeColor = themeColors[index % themeColors.length];
            return (
              <Pressable
                key={theme.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                disabled={isFindingLocation}
                onPress={() => toggleTheme(theme.id)}
                style={[
                  styles.themeCard,
                  selected && styles.themeCardActive,
                  isFindingLocation && styles.controlDisabled,
                ]}
              >
                <View style={[styles.themeIcon, { backgroundColor: `${themeColor}18` }]}>
                  <Ionicons name={getThemeIcon(theme.name)} size={20} color={themeColor} />
                </View>
                <Text size="sm" weight="medium" color={colors.text}>{theme.name}</Text>
                {selected && <Ionicons name="checkmark-circle" size={17} color={colors.accent} />}
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.distanceCard}>
        <View style={styles.distanceHeader}>
          <View>
            <Text size="lg" weight="bold" color={colors.text}>How far will you wander?</Text>
            <Text size="sm" color={colors.textSecondary}>Set your maximum distance</Text>
          </View>
          <View style={styles.distanceValue}>
            <Text size="sm" weight="bold" color={colors.accent}>
              {formatDistance(selectedDistance)}
            </Text>
          </View>
        </View>
        <View style={styles.distanceOptions}>
          {distances.map((distance) => {
            const selected = distance.meters === selectedDistance;
            return (
              <Pressable
                key={distance.meters}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                disabled={isFindingLocation}
                onPress={() => {
                  setSelectedDistance(distance.meters);
                  setDestination(null);
                  setDiscoveryError(null);
                }}
                style={[
                  styles.distanceOption,
                  selected && styles.distanceOptionActive,
                  isFindingLocation && styles.controlDisabled,
                ]}
              >
                <Text
                  size="sm"
                  weight={selected ? 'bold' : 'medium'}
                  color={selected ? colors.surface : colors.textSecondary}
                >
                  {distance.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: isFindingLocation || isLoadingThemes || themes.length === 0,
        }}
        disabled={isFindingLocation || isLoadingThemes || themes.length === 0}
        onPress={handleFindLocation}
        style={[
          styles.cta,
          (isFindingLocation || isLoadingThemes || themes.length === 0) && styles.controlDisabled,
        ]}
      >
        <View style={styles.ctaIcon}>
          {isFindingLocation
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Ionicons name="shuffle" size={20} color={colors.accent} />}
        </View>
        <View style={styles.ctaCopy}>
          <Text size="md" weight="bold" color={colors.text}>
            {isFindingLocation ? 'Finding your next stop…' : 'Find me a place'}
          </Text>
          <Text size="sm" color={colors.textSecondary}>A surprise spot picked just for you.</Text>
        </View>
        {!isFindingLocation && (
          <Ionicons name="arrow-forward-circle" size={30} color={colors.accent} />
        )}
      </Pressable>

      {discoveryError && (
        <View style={styles.errorCard} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={18} color="#A74B42" />
          <Text size="sm" color="#8F3F37">{discoveryError}</Text>
        </View>
      )}
    </PageShell>
  );
}

function getThemeIcon(name: string): React.ComponentProps<typeof Ionicons>['name'] {
  const normalized = name.toLowerCase();
  if (normalized.includes('nature')) return 'leaf-outline';
  if (normalized.includes('urban') || normalized.includes('city')) return 'business-outline';
  if (normalized.includes('culture')) return 'library-outline';
  if (normalized.includes('art')) return 'color-palette-outline';
  if (normalized.includes('monument') || normalized.includes('historic')) return 'trophy-outline';
  return 'sparkles-outline';
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    gap: 7,
    marginBottom: 25,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  themeMessage: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 22,
  },
  themeCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeCardActive: {
    borderColor: colors.accent,
    backgroundColor: '#F3F7F1',
  },
  themeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  distanceCard: {
    padding: 17,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  distanceOption: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceValue: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#E9F0E7',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D5DFD0',
    backgroundColor: '#EEF4E9',
  },
  controlDisabled: {
    opacity: 0.65,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  ctaCopy: {
    flex: 1,
    gap: 2,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    marginTop: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8D6D1',
    backgroundColor: '#FFF8F5',
  },
});
