// A8 日期选择器（原生）。Android：系统日期对话框；iOS：在弹层中显示 inline 日历，点 Done 确认。
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, colors } from './ui';

const toDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(toDate(value));

  function press() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'date',
        onChange: (e, d) => e.type === 'set' && d && onChange(toStr(d)),
      });
    } else {
      setDraft(toDate(value));
      setOpen(true);
    }
  }

  return (
    <>
      <Pressable testID="control-date" style={styles.field} onPress={press}>
        <Text style={styles.text}>{value}</Text>
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal transparent visible={open} animationType="none">
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <DateTimePicker testID="control-date-picker" value={draft} mode="date" display="inline" onChange={(_, d) => d && setDraft(d)} />
              <Button
                testID="control-date-done"
                title="Done"
                onPress={() => {
                  onChange(toStr(draft));
                  setOpen(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10 },
  text: { fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', padding: 16, gap: 12 },
});
