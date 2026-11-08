import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/state/useAuthStore';

export default function RootLayout() {
  const initializeSession = useAuthStore((state) => state.initializeSession);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (__DEV__ || !('serviceWorker' in navigator)) return;

    const baseUrl = process.env.EXPO_BASE_URL ?? '';
    const basePath = baseUrl ? `/${baseUrl.replace(/^\/+|\/+$/g, '')}` : '';

    navigator.serviceWorker
      .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
      .catch((error: unknown) => {
        console.error('Could not register the app service worker.', error);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Slot />
    </SafeAreaProvider>
  );
}
