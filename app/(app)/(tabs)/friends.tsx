import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text as RNText, TextInput, View } from 'react-native';
import { PageShell } from '../../../src/components/PageShell';
import { Text } from '../../../src/components/primitives/Text';
import { colors } from '../../../src/theme';

const requests = [
  { name: 'Geert De Padvinder', handle: '@geert.depadvinder', initials: 'GD', time: '2 hours ago', color: '#DDEBD9' },
  { name: 'Leo De Kaartlezer', handle: '@leo.dekaartlezer', initials: 'LD', time: 'Yesterday', color: '#F3E2D2' },
];

const friends = [
  { name: 'Dirk De Verkenner', handle: '@dirk.deverkenner', initials: 'DD', status: 'Online', xp: '840 XP', color: '#F1DDE3', badges: ['leaf', 'camera', 'trail'] },
  { name: 'Josef Uit Den Bos', handle: '@josef.uitdenbos', initials: 'JU', status: 'Online', xp: '620 XP', color: '#DDE8F0', badges: ['sunny', 'business', 'leaf'] },
  { name: 'Albert De Stapper', handle: '@albert.destapper', initials: 'AD', status: 'Away', xp: '410 XP', color: '#EEE5D2', badges: ['color', 'trail'] },
];

export default function FriendsScreen() {
  return (
    <PageShell>
      <View style={styles.pageHeader}>
        <View>
          <Text size="sm" weight="bold" color={colors.accent}>YOUR</Text>
          <RNText style={styles.title}>Friends</RNText>
        </View>
        <View style={styles.countPill}>
          <Ionicons name="people" size={15} color={colors.accent} />
          <Text size="sm" weight="bold" color={colors.accent}>{friends.length}</Text>
        </View>
      </View>

      <View style={styles.inviteCard}>
        <View style={styles.inviteTitleRow}>
          <View style={styles.inviteIcon}>
            <Ionicons name="person-add-outline" size={19} color={colors.accent} />
          </View>
          <View style={styles.inviteCopy}>
            <Text size="md" weight="bold" color={colors.text}>Bring a friend along</Text>
            <Text size="sm" color={colors.textSecondary}>Find them by username</Text>
          </View>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={17} color={colors.textSecondary} />
            <TextInput
              placeholder="Enter a username"
              placeholderTextColor={colors.textPlaceholder}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.sendButton}>
            <Text size="sm" weight="bold" color={colors.surface}>Send</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text size="lg" weight="bold" color={colors.text}>Friend requests</Text>
          <View style={styles.requestCount}>
            <Text size="sm" weight="bold" color={colors.accent}>{requests.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.requestList}>
        {requests.map((request) => (
          <View key={request.handle} style={styles.requestCard}>
            <View style={[styles.avatar, { backgroundColor: request.color }]}>
              <Text weight="bold" color={colors.text}>{request.initials}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text size="md" weight="bold" color={colors.text}>{request.name}</Text>
              <Text size="sm" color={colors.textSecondary}>{request.time}</Text>
            </View>
            <View style={styles.requestActions}>
              <View style={styles.acceptButton}>
                <Ionicons name="checkmark" size={17} color={colors.surface} />
              </View>
              <View style={styles.declineButton}>
                <Ionicons name="close" size={17} color={colors.textSecondary} />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text size="lg" weight="bold" color={colors.text}>Your friends</Text>
        </View>
      </View>

      <View style={styles.friendList}>
        {friends.map((friend) => (
          <View key={friend.handle} style={styles.friendCard}>
            <View style={styles.friendTopRow}>
              <View style={[styles.avatar, { backgroundColor: friend.color }]}>
                <Text weight="bold" color={colors.text}>{friend.initials}</Text>
                <View style={[styles.statusDot, friend.status === 'Away' && styles.statusAway]} />
              </View>
              <View style={styles.personInfo}>
                <Text size="md" weight="bold" color={colors.text}>{friend.name}</Text>
                <View style={styles.statusLine}>
                  <Text size="sm" color={colors.textSecondary}>{friend.status}</Text>
                </View>
              </View>
              <View style={styles.xpPill}>
                <Text size="sm" weight="bold" color={colors.text}>{friend.xp}</Text>
              </View>
            </View>
            <View style={styles.badgePreview}>
              <Text size="sm" color={colors.textSecondary}>Recent badges</Text>
              <View style={styles.badgeIcons}>
                {friend.badges.map((badge, index) => (
                  <View key={`${friend.handle}-${badge}`} style={[styles.miniBadge, { transform: [{ rotate: `${index % 2 === 0 ? '-8deg' : '8deg'}` }] }]}>
                    <Ionicons name={badgeIcon(badge)} size={14} color={badgeColor(index)} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </PageShell>
  );
}

function badgeIcon(badge: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (badge === 'leaf') return 'leaf';
  if (badge === 'camera') return 'camera';
  if (badge === 'trail') return 'trail-sign';
  if (badge === 'sunny') return 'sunny';
  if (badge === 'business') return 'business';
  return 'color-palette';
}

function badgeColor(index: number) {
  return ['#56855F', '#CA873F', '#6682A0'][index % 3];
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: colors.text,
    marginTop: 4,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E9F0E7',
  },
  inviteCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 25,
  },
  inviteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14,
  },
  inviteIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E9F0E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCopy: {
    gap: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    minWidth: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  sectionHeader: {
    marginBottom: 13,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 3,
  },
  requestCount: {
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0E7',
  },
  requestList: {
    gap: 9,
    marginBottom: 25,
  },
  requestCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInfo: {
    flex: 1,
    marginLeft: 11,
    gap: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 7,
  },
  acceptButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  declineButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  friendList: {
    gap: 11,
  },
  friendCard: {
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  friendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#42A66C',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  statusAway: {
    backgroundColor: '#D6A14F',
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#42A66C',
  },
  statusBulletAway: {
    backgroundColor: '#D6A14F',
  },
  xpPill: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: '#FBF4E9',
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  badgeIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBadge: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
