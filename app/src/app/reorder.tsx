// A12：按住把手拖拽排序（gesture-handler v3 Pan）
import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { colors, Label } from '@/components/ui';

const ROW_H = 56;
const INITIAL = Array.from({ length: 10 }, (_, i) => `R${i + 1}`);

function DraggableRow({ label, index, onDrop }: { label: string; index: number; onDrop: (from: number, to: number) => void }) {
  const dy = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 2,
    onActivate: () => setDragging(true),
    onUpdate: (e) => dy.setValue(e.translationY),
    onDeactivate: (e) => {
      setDragging(false);
      dy.setValue(0);
      const to = Math.max(0, Math.min(INITIAL.length - 1, index + Math.round(e.translationY / ROW_H)));
      onDrop(index, to);
    },
  });
  return (
    <Animated.View
      testID={`reorder-row-${label}`}
      style={[styles.row, dragging && styles.dragging, { transform: [{ translateY: dy }], zIndex: dragging ? 10 : 0 }]}>
      <Text style={styles.label}>{label}</Text>
      <GestureDetector gesture={pan}>
        <View testID={`reorder-handle-${label}`} style={styles.handle}>
          <Text style={styles.handleText}>≡</Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function Reorder() {
  const [order, setOrder] = useState(INITIAL);
  function drop(from: number, to: number) {
    if (from === to) return;
    setOrder((o) => {
      const next = [...o];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }
  return (
    <View style={{ flex: 1 }}>
      <Label testID="reorder-summary" style={{ padding: 12 }}>
        {order.join(',')}
      </Label>
      {order.map((label, i) => (
        <DraggableRow key={label} label={label} index={i} onDrop={drop} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dragging: { backgroundColor: '#EEF5FD', elevation: 4, shadowOpacity: 0.2, shadowRadius: 6 },
  label: { fontSize: 16 },
  handle: { width: 56, height: ROW_H, alignItems: 'center', justifyContent: 'center' },
  handleText: { fontSize: 24, color: colors.muted },
});
