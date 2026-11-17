// A4：带淡入动画的确认 Modal。用自绘覆盖层而不是 RN <Modal>，以便动画时长受 jitter 控制。
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { duration } from '@/lib/anim';
import { Button, colors } from './ui';

export function ConfirmModal({
  visible,
  message,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: duration(300), useNativeDriver: true }).start();
    }
  }, [visible, opacity]);
  if (!visible) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}>
      <View testID="confirm-modal" style={styles.card}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.row}>
          <Button testID="confirm-cancel" title="Cancel" onPress={onCancel} />
          <Button testID="confirm-ok" title="Delete" onPress={onConfirm} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '80%', gap: 16, borderColor: colors.border },
  message: { fontSize: 17 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
