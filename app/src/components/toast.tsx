// A15：显示 2 秒后自动消失的 Toast。显示时长固定（不受 jitter 影响），淡入淡出时长受 jitter 影响。
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { duration, TOAST_VISIBLE_MS } from '@/lib/anim';

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: duration(150), useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: duration(150), useNativeDriver: true }).start(() =>
          setMessage(null),
        );
      }, TOAST_VISIBLE_MS);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message !== null && (
        <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
          <Text testID="toast" style={styles.text}>
            {message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  text: { color: 'white', fontSize: 16 },
});
