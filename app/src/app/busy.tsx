// A11：永不静止的装饰动画，与可操作的按钮在同一页面
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Button, colors, Label, Screen } from '@/components/ui';
import { duration } from '@/lib/anim';

export default function Busy() {
  const spin = useRef(new Animated.Value(0)).current;
  const [taps, setTaps] = useState(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: duration(1200), easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Screen>
      <View style={styles.center}>
        <Animated.View testID="busy-spinner" style={[styles.spinner, { transform: [{ rotate }] }]} />
      </View>
      <Button testID="busy-tap" title="Tap me" onPress={() => setTaps((n) => n + 1)} />
      <Label testID="busy-result">{taps === 0 ? 'Not tapped' : `Tapped ${taps}`}</Label>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', padding: 24 },
  spinner: { width: 80, height: 80, borderRadius: 16, borderWidth: 8, borderColor: colors.primary, borderTopColor: 'transparent' },
});
