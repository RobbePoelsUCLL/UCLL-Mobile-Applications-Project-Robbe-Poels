import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { ProgressiveRouteMap } from './ProgressiveRouteMap';
import {
  getBearingDegrees,
  getDistanceMeters,
  getRelativeBearingDegrees,
  getTurnInstruction,
} from '../services/locationService';
import type { Coordinates } from '../services/locationService';
import { getNearestRouteIndex, getVisibleRouteEndIndex, getWalkingRoute } from '../services/routingService';
import type { NearbyLocation } from '../types/AdventureLocation';
import { colors } from '../theme';
import { PageShell } from './PageShell';
import { Text } from './primitives/Text';

const ARRIVAL_RADIUS_METERS = 40;
const MAX_ARRIVAL_ACCURACY_METERS = 60;
const MAX_ROUTE_LOOKAHEAD_METERS = 120;
type GuideMode = 'compass' | 'map';

interface LocationGuideProps {
  destination: NearbyLocation;
  startingPosition: Coordinates & { accuracy: number | null };
  onCancel: () => void;
}

interface CurrentPosition extends Coordinates {
  accuracy: number | null;
}

export function LocationGuide({ destination, startingPosition, onCancel }: LocationGuideProps) {
  const [currentPosition, setCurrentPosition] = useState<CurrentPosition>(startingPosition);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassError, setCompassError] = useState<string | null>(null);
  const [route, setRoute] = useState<Coordinates[] | null>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeProgressIndex, setRouteProgressIndex] = useState(0);
  const [guideMode, setGuideMode] = useState<GuideMode>('compass');

  useEffect(() => {
    let isActive = true;
    setRouteLoading(true);
    setRouteError(null);

    getWalkingRoute(startingPosition, destination)
      .then((walkingRoute) => {
        if (!isActive) return;
        setRoute(walkingRoute);
        setRouteProgressIndex(0);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setRoute(null);
        setRouteError(
          error instanceof Error ? error.message : 'Could not load a walking route.',
        );
      })
      .finally(() => {
        if (isActive) setRouteLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [destination, startingPosition]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let subscription: Location.LocationSubscription | null = null;
      let headingSubscription: Location.LocationSubscription | null = null;
      setLocationError(null);
      setCompassError(null);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3_000,
          distanceInterval: 5,
        },
        (position) => {
          setCurrentPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
      )
        .then((locationSubscription) => {
          if (isActive) {
            subscription = locationSubscription;
          } else {
            locationSubscription.remove();
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setLocationError(
              error instanceof Error ? error.message : 'Live location updates are unavailable.',
            );
          }
        });

      Location.watchHeadingAsync((heading) => {
        const degrees = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
        if (isActive && heading.accuracy > 0 && Number.isFinite(degrees)) {
          setDeviceHeading(degrees);
          setCompassError(null);
        }
      })
        .then((locationSubscription) => {
          if (isActive) {
            headingSubscription = locationSubscription;
          } else {
            locationSubscription.remove();
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setCompassError(
              error instanceof Error ? error.message : 'Device compass is unavailable.',
            );
          }
        });

      return () => {
        isActive = false;
        subscription?.remove();
        headingSubscription?.remove();
      };
    }, []),
  );

  const distanceMeters = getDistanceMeters(currentPosition, destination);
  const bearingDegrees = getBearingDegrees(currentPosition, destination);
  const relativeBearingDegrees = deviceHeading === null
    ? null
    : getRelativeBearingDegrees(bearingDegrees, deviceHeading);
  const hasAccuratePosition =
    currentPosition.accuracy !== null &&
    currentPosition.accuracy <= MAX_ARRIVAL_ACCURACY_METERS;
  const hasArrived = distanceMeters <= ARRIVAL_RADIUS_METERS && hasAccuratePosition;
  const needsBetterAccuracy = distanceMeters <= ARRIVAL_RADIUS_METERS && !hasAccuratePosition;
  const visibleRouteEndIndex = route
    ? getVisibleRouteEndIndex(
        route,
        routeProgressIndex,
        destination,
        distanceMeters,
        ARRIVAL_RADIUS_METERS,
        MAX_ROUTE_LOOKAHEAD_METERS,
      )
    : -1;

  useEffect(() => {
    if (!route) return;
    setRouteProgressIndex((currentIndex) =>
      Math.max(currentIndex, getNearestRouteIndex(route, currentPosition, currentIndex)),
    );
  }, [currentPosition, route]);

  return (
    <PageShell>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.backButton}
        >
          <Ionicons name="close" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.topBarCopy}>
          <Text size="sm" weight="bold" color={colors.accent}>CANCEL ROUTE</Text>
          <Text size="sm" color={colors.textSecondary}>Or keep going to reveal your find</Text>
        </View>
        {/* <View style={styles.secretIcon}>
          <Ionicons name="eye-off-outline" size={19} color={colors.accent} />
        </View> */}
      </View>

      {hasArrived ? (
        <View style={styles.arrivalContent}>
          <View style={styles.arrivalIcon}>
            <Ionicons name="sparkles" size={32} color="#BF8A39" />
          </View>
          <Text size="sm" weight="bold" color={colors.accent} align="center">YOU MADE IT</Text>
          <RNText style={styles.arrivalTitle}>{destination.name}</RNText>
          <Text size="md" color={colors.textSecondary} align="center">
            {destination.description ?? 'A new place discovered. Take a moment to enjoy it.'}
          </Text>
          <View style={styles.arrivalThemes}>
            {destination.themes.map((theme) => (
              <View key={theme.id} style={styles.themePill}>
                <Text size="sm" weight="medium" color={colors.accent}>{theme.name}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.doneButton} onPress={onCancel} accessibilityRole="button">
            <Text size="md" weight="bold" color={colors.surface}>Back to exploring</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.intro}>
            <Text size="sm" weight="bold" color={colors.accent}>YOUR DESTINATION IS A SURPRISE</Text>
            <RNText style={styles.headline}>Enjoy your{'\n'}journey.</RNText>
            <Text size="md" color={colors.textSecondary}>
              {needsBetterAccuracy
                ? 'You’re close. Step into an open area for a more accurate location fix.'
                : 'We’ll keep the destination secret until you arrive.'}
            </Text>
          </View>

          <View style={styles.modeSelector}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: guideMode === 'compass' }}
              onPress={() => setGuideMode('compass')}
              style={[styles.modeButton, guideMode === 'compass' && styles.modeButtonActive]}
            >
              <Ionicons
                name="compass-outline"
                size={17}
                color={guideMode === 'compass' ? colors.surface : colors.textSecondary}
              />
              <Text size="sm" weight="bold" color={guideMode === 'compass' ? colors.surface : colors.textSecondary}>
                Compass
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: guideMode === 'map' }}
              onPress={() => setGuideMode('map')}
              style={[styles.modeButton, guideMode === 'map' && styles.modeButtonActive]}
            >
              <Ionicons
                name="map-outline"
                size={17}
                color={guideMode === 'map' ? colors.surface : colors.textSecondary}
              />
              <Text size="sm" weight="bold" color={guideMode === 'map' ? colors.surface : colors.textSecondary}>
                Map
              </Text>
            </Pressable>
          </View>

          {guideMode === 'compass' ? (
            <View style={styles.compassCard}>
            <View style={styles.compass}>
              <RNText style={styles.northLabel}>N</RNText>
              <View style={styles.compassTickTop} />
              <View style={styles.compassTickRight} />
              <View style={styles.compassTickBottom} />
              <View style={styles.compassTickLeft} />
              {relativeBearingDegrees !== null && (
                <View style={[styles.arrowContainer, { transform: [{ rotate: `${relativeBearingDegrees}deg` }] }]}>
                  <Ionicons name="navigate" size={55} color={colors.accent} />
                </View>
              )}
              <View style={styles.compassCenter} />
            </View>
            <RNText style={styles.directionText}>
              {relativeBearingDegrees === null
                ? 'Calibrating compass…'
                : getTurnInstruction(relativeBearingDegrees)}
            </RNText>
            <Text size="sm" color={colors.textSecondary} align="center">
              Point the top of your phone in the arrow’s direction.
            </Text>
          </View>
          ) : (
            <View style={styles.mapCard}>
              {route && visibleRouteEndIndex >= 0 ? (
                <ProgressiveRouteMap
                  center={currentPosition}
                  route={route.slice(0, visibleRouteEndIndex + 1)}
                />
              ) : (
                <View style={styles.routeLoading}>
                  {routeLoading
                    ? <ActivityIndicator size="small" color={colors.accent} />
                    : <Ionicons name="map-outline" size={20} color="#A74B42" />}
                  <Text size="sm" color={routeLoading ? colors.textSecondary : '#8F3F37'}>
                    {routeLoading
                      ? 'Finding a walking route…'
                      : routeError ?? 'Walking route is unavailable.'}
                  </Text>
                  {!routeLoading && routeError && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setGuideMode('compass')}
                      style={styles.returnToCompass}
                    >
                      <Text size="sm" weight="bold" color={colors.accent}>Use compass instead</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {/* <RNText style={styles.navigationNote}>
                Public Valhalla demo routing sends your start and destination coordinates to its server. Map tiles are provided by CARTO.
              </RNText> */}
              <RNText style={styles.navigationNote}>
                Your navigation line grows as you make progress.
              </RNText>
            </View>
          )}

          <View style={styles.distanceCard}>
            <View style={styles.distanceIcon}>
              <Ionicons name="footsteps-outline" size={21} color={colors.accent} />
            </View>
            <View style={styles.distanceCopy}>
                <Text size="sm" weight="bold" color={colors.textSecondary}>DISTANCE TO GO</Text>
                <RNText style={styles.distanceValue}>{formatDistance(distanceMeters)}</RNText>
            </View>
            {currentPosition.accuracy !== null && (
              <View style={styles.gpsStatus}>
                <View style={[styles.statusDot, !hasAccuratePosition && styles.statusDotWeak]} />
                <Text size="sm" color={colors.textSecondary}>
                  {hasAccuratePosition ? 'GPS ready' : 'Weak GPS'}
                </Text>
              </View>
            )}
          </View>

          {locationError && (
            <View style={styles.errorCard} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle-outline" size={19} color="#A74B42" />
              <Text size="sm" color="#8F3F37">{locationError}</Text>
            </View>
          )}

          {compassError && (
            <View style={styles.errorCard} accessibilityLiveRegion="polite">
              <Ionicons name="compass-outline" size={19} color="#A74B42" />
              <Text size="sm" color="#8F3F37">
                Device compass is unavailable. Try moving away from magnetic interference and recalibrating your device.
              </Text>
            </View>
          )}

          {!compassError && deviceHeading === null && (
            <View style={styles.waitingCard}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text size="sm" color={colors.textSecondary}>Calibrating device compass…</Text>
            </View>
          )}

          {needsBetterAccuracy && (
            <View style={styles.accuracyCard}>
              <Ionicons name="locate-outline" size={18} color="#916A2D" />
              <Text size="sm" color="#785923">
                The GPS signal is not accurate enough to confirm arrival yet.
              </Text>
            </View>
          )}

          {!locationError && currentPosition.accuracy === null && (
            <View style={styles.waitingCard}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text size="sm" color={colors.textSecondary}>Updating your live location…</Text>
            </View>
          )}
        </>
      )}
    </PageShell>
  );
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 34,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topBarCopy: {
    flex: 1,
    gap: 2,
  },
  secretIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0E7',
  },
  intro: {
    marginBottom: 23,
  },
  headline: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 7,
    marginBottom: 8,
  },
  compassCard: {
    alignItems: 'center',
    padding: 21,
    marginBottom: 15,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 7,
    padding: 4,
    marginBottom: 12,
    borderRadius: 15,
    backgroundColor: '#EFEEE8',
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
  },
  mapCard: {
    gap: 7,
    marginBottom: 15,
  },
  routeLoading: {
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  returnToCompass: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E9F0E7',
  },
  navigationNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  compass: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 95,
    borderWidth: 1,
    borderColor: '#E5E3D9',
    backgroundColor: '#F9F8F3',
  },
  northLabel: {
    position: 'absolute',
    top: 12,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  compassTickTop: {
    position: 'absolute',
    top: 34,
    width: 1,
    height: 11,
    backgroundColor: '#C8C4B8',
  },
  compassTickRight: {
    position: 'absolute',
    right: 34,
    width: 11,
    height: 1,
    backgroundColor: '#C8C4B8',
  },
  compassTickBottom: {
    position: 'absolute',
    bottom: 34,
    width: 1,
    height: 11,
    backgroundColor: '#C8C4B8',
  },
  compassTickLeft: {
    position: 'absolute',
    left: 34,
    width: 11,
    height: 1,
    backgroundColor: '#C8C4B8',
  },
  arrowContainer: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassCenter: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  directionText: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginTop: 17,
    marginBottom: 5,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 13,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  distanceIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0E7',
  },
  distanceCopy: {
    flex: 1,
    gap: 1,
  },
  distanceValue: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#42A66C',
  },
  statusDotWeak: {
    backgroundColor: '#D6A14F',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    marginBottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8D6D1',
    backgroundColor: '#FFF8F5',
  },
  accuracyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    marginBottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9DFC8',
    backgroundColor: '#FFFAEF',
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 13,
  },
  arrivalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    paddingBottom: 40,
  },
  arrivalIcon: {
    width: 78,
    height: 78,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8EEDC',
    marginBottom: 8,
  },
  arrivalTitle: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  arrivalThemes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  themePill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: '#E9F0E7',
  },
  doneButton: {
    alignSelf: 'stretch',
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accent,
    marginTop: 11,
  },
});
