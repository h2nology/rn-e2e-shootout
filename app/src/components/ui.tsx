import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

export function Screen({ children, scroll = false, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  if (scroll) {
    return <ScrollView contentContainerStyle={[styles.screen, style]}>{children}</ScrollView>;
  }
  return <View style={[styles.screen, { flex: 1 }, style]}>{children}</View>;
}

export function Button({
  testID,
  title,
  onPress,
  disabled,
}: {
  testID: string;
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function Label({ testID, children, style }: { testID?: string; children: ReactNode; style?: object }) {
  return (
    <Text testID={testID} style={[styles.label, style]}>
      {children}
    </Text>
  );
}

export const colors = {
  primary: '#208AEF',
  danger: '#D93025',
  border: '#D0D7DE',
  muted: '#6B7280',
};

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 10 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  label: { fontSize: 16 },
});
