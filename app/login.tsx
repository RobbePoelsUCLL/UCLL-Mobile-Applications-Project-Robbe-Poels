import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/state/useAuthStore';
import { InputField } from '../src/components/primitives/InputField';
import { StyledButton } from '../src/components/StyledButton';
import { Stack } from '../src/components/primitives/Stack';
import { colors, spacing } from '../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    setError('');
    try {
      await login(email, password);
      router.replace('/');
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </Stack>
          <View style={styles.input}>
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              testID="email-input"
            />
          </View>
          <View>
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              testID="password-input"
              error={error !== '' ? error : undefined}
            />
          </View>
          <StyledButton
            label="Log in"
            onPress={handleLogin}
            isLoading={isLoading}
            testID="login-button"
          />
        </Stack>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    marginVertical: spacing.md
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
