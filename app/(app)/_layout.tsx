import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '../../src/state/useAuthStore';
import { Spinner } from '../../src/components/primitives/Spinner';
import { colors } from '../../src/theme';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Spinner />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="route" />
      <Stack.Screen name="details/[id]" />
    </Stack>
  );
}
