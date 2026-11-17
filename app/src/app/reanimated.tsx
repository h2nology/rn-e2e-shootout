// A13：Reanimated 弹簧动画（UI 线程）展开卡片，展开后点击卡片内按钮
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Button, colors, Label, Screen } from '@/components/ui';
import { duration } from '@/lib/anim';

const COLLAPSED = 80;
const EXPANDED = 220;

export default function ReanimatedScreen() {
  const height = useSharedValue(COLLAPSED);
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState('Idle');
  const style = useAnimatedStyle(() => ({ height: height.value }));

  function toggle() {
    if (expanded) return;
    height.value = withSpring(EXPANDED, { duration: duration(600) }, (finished) => {
      if (finished) scheduleOnRN(setExpanded, true);
    });
  }

  return (
    <Screen>
      <Pressable testID="rea-card" onPress={toggle}>
        <Animated.View style={[styles.card, style]}>
          <Text style={styles.title}>Tap to expand</Text>
          {expanded && <Button testID="rea-card-action" title="Do action" onPress={() => setResult('Action done')} />}
        </Animated.View>
      </Pressable>
      <Label testID="rea-result">{result}</Label>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#EEF5FD', borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: 16, gap: 16, overflow: 'hidden' },
  title: { fontSize: 18 },
});
