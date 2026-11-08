import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { AdventureBadge } from '../../../src/components/AdventureBadge';
import { PageShell } from '../../../src/components/PageShell';
import { Text } from '../../../src/components/primitives/Text';
import { useAuthStore } from '../../../src/state/useAuthStore';
import { colors } from '../../../src/theme';

const badges = [
  { label: 'Green thumb', icon: 'leaf' as const, color: '#4E8B5C' },
  { label: 'City slicker', icon: 'business' as const, color: '#6981A3' },
  { label: 'Art lover', icon: 'color-palette' as const, color: '#C17C48' },
  { label: 'Early bird', icon: 'sunny' as const, color: '#C39537' },
  { label: 'Trail finder', icon: 'trail-sign' as const, color: '#668D78' },
  { label: 'Culture buff', icon: 'library' as const, color: '#A56B83' },
  { label: 'Wayfinder', icon: 'compass' as const, color: '#4F83A0' },
];

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const email = user?.email ?? 'explorer@roam.app';
  const username = email.split('@')[0].replace(/[._-]/g, ' ');
  const displayName = username.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <PageShell>
      <View style={styles.pageHeader}>
        <View>
          <Text size="sm" weight="bold" color={colors.accent}>YOUR</Text>
          <RNText style={styles.title}>Profile</RNText>
        </View>
        <View style={styles.editButton}>
          <Ionicons name="create-outline" size={19} color={colors.text} />
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text size="xl" weight="bold" color={colors.accent}>{initials}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <RNText style={styles.name}>{displayName}</RNText>
        <Text size="sm" color={colors.textSecondary}>{email}</Text>
        <View style={styles.onlineLabel}>
          <View style={styles.statusDot} />
          <Text size="sm" weight="medium" color="#398252">Out exploring</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View style={styles.levelIcon}>
            <Ionicons name="trophy" size={21} color="#BB8536" />
          </View>
          <View style={styles.levelCopy}>
            <Text size="sm" weight="bold" color={colors.textSecondary}>LEVEL 4</Text>
            <Text size="lg" weight="bold" color={colors.text}>Curious wanderer</Text>
          </View>
          <View style={styles.xpValue}>
            <Text size="sm" weight="bold" color={colors.accent}>320 XP</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.progressFoot}>
          <Text size="sm" color={colors.textSecondary}>A lovely start!</Text>
          <Text size="sm" weight="medium" color={colors.textSecondary}>180 XP to next level</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F0E4' }]}>
            <Ionicons name="location" size={18} color="#4E8B5C" />
          </View>
          <RNText style={styles.statValue}>12</RNText>
          <Text size="sm" color={colors.textSecondary}>Places found</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F6EDE0' }]}>
            <Ionicons name="footsteps" size={18} color="#C17C48" />
          </View>
          <RNText style={styles.statValue}>8</RNText>
          <Text size="sm" color={colors.textSecondary}>Recent routes</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E8EDF4' }]}>
            <Ionicons name="people" size={18} color="#6981A3" />
          </View>
          <RNText style={styles.statValue}>3</RNText>
          <Text size="sm" color={colors.textSecondary}>Good friends</Text>
        </View>
      </View>

      <View style={styles.badgesHeader}>
        <View>
          <Text size="lg" weight="bold" color={colors.text}>My badges</Text>
          <Text size="sm" color={colors.textSecondary}>Little keepsakes from your outings</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text size="sm" weight="bold" color={colors.accent}>{badges.length}</Text>
        </View>
      </View>
      <View style={styles.badgesGrid}>
        {badges.map((badge) => (
          <AdventureBadge key={badge.label} {...badge} />
        ))}
      </View>

      <Pressable style={styles.logoutButton} onPress={logout} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={18} color="#A74B42" />
        <Text size="md" weight="medium" color="#A74B42">Log out</Text>
      </Pressable>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: colors.text,
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1EBDD',
    borderWidth: 4,
    borderColor: colors.surface,
    elevation: 8,
  },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#42A66C',
    borderWidth: 3,
    borderColor: colors.background,
  },
  name: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  onlineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#E8F2E6',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#42A66C',
  },
  progressCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8EEDC',
    marginRight: 11,
  },
  levelCopy: {
    flex: 1,
    gap: 1,
  },
  xpValue: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E9F0E7',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#EAE9E1',
  },
  progressFill: {
    width: '64%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  progressFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeCount: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0E7',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    marginBottom: 25,
  },
  logoutButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8D6D1',
    backgroundColor: '#FFF8F5',
  },
});
