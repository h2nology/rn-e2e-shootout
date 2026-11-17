// A24：多个元素共用同一 testID；以及只有 accessibility label 的元素
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, Label, Screen } from '@/components/ui';

export default function Dup() {
  const [row, setRow] = useState('');
  const [a11y, setA11y] = useState('');
  return (
    <Screen>
      <View testID="dup-list">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} testID="dup-row" style={styles.row} onPress={() => setRow(`Row ${n}`)}>
            <Text style={styles.text}>{`Row ${n}`}</Text>
          </Pressable>
        ))}
      </View>
      <Label testID="dup-result">{row}</Label>
      <Pressable accessibilityLabel="Secret button" accessibilityRole="button" style={styles.secret} onPress={() => setA11y('Found')}>
        <Text style={styles.text}>?</Text>
      </Pressable>
      <Label testID="a11y-result">{a11y}</Label>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  text: { fontSize: 16 },
  secret: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
