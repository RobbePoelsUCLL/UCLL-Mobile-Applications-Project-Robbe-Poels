import { TextInput, View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors } from '@/theme/colors';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  testID?: string;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  testID,
}: InputFieldProps) {
  return (
    <View style={styles.container}>
      <Text size="sm" weight="medium">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={[styles.input, error !== undefined && styles.inputError]}
        testID={testID}
        autoCapitalize="none"
      />
      {error !== undefined && <Text size="sm" color="red">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {},
});
