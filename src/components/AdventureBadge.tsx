import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Text } from './primitives/Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AdventureBadgeProps {
  label: string;
  icon: IconName;
  color: string;
}

export function AdventureBadge({ label, icon, color }: AdventureBadgeProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text size="sm" color={colors.text} align="center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 76,
    alignItems: 'center',
    gap: 7,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '-4deg' }],
  },
});