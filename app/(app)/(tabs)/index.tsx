import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VisitedLocationsMap } from '../../../src/components/VisitedLocationsMap';
import { useAuthStore } from '../../../src/state/useAuthStore';
import { getVisitedLocations } from '../../../src/services';
import type { VisitedLocation } from '../../../src/types/VisitedLocation';
import { colors } from '../../../src/theme';
import { Text } from '../../../src/components/primitives/Text';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [visitedLocations, setVisitedLocations] = useState<VisitedLocation[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [visitsError, setVisitsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setVisitedLocations([]);
      setIsLoadingVisits(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingVisits(true);
    setVisitsError(null);
    getVisitedLocations(user.id)
      .then((locations) => {
        if (isMounted) setVisitedLocations(locations);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setVisitsError(
          error instanceof Error ? error.message : 'Could not load your visited places.',
        );
      })
      .finally(() => {
        if (isMounted) setIsLoadingVisits(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <VisitedLocationsMap
        locations={visitedLocations}
        isLoading={isLoadingVisits}
        error={visitsError}
        fullScreen
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/route')}
        style={styles.startButton}
      >
        <Text size="xl" weight="bold" color={colors.text}>Start a new adventure?</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  startButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 45,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.97)',
    elevation: 5,
  },
});
