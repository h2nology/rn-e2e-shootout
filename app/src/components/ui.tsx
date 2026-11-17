import { HeaderHeightContext } from 'expo-router/react-navigation';
import { useContext, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, type ViewStyle } from 'react-native';

/**
 * iOS 26+ 上原生标题栏浮在内容之上（headerTransparent: false、contentInsetAdjustmentBehavior 均无效，
 * 见 findings.md），因此在 iOS 上按标题栏高度手动留出顶部空间。
 */
export function useHeaderInset(): number {
  const h = useContext(HeaderHeightContext) ?? 0;
  return Platform.OS === 'ios' ? h : 0;
}

/** 页面容器 */
export function Screen({ children, scroll = false, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const top = useHeaderInset();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scroll}
      contentContainerStyle={[styles.screen, { paddingTop: 16 + top }, !scroll && { flexGrow: 1 }, style]}>
      {children}
    </ScrollView>
  );
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
