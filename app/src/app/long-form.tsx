// A18：底部输入框会被键盘遮挡，页面依靠 KeyboardAvoidingView 上移
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, colors, Label } from '@/components/ui';

export default function LongForm() {
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  // Android 15+ 强制 edge-to-edge：底部要留出系统导航栏的高度，否则 Submit 会被导航栏遮住（实测）
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <Pressable style={[styles.container, { paddingBottom: 32 + insets.bottom }]} onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.spacer}>
          <Label>Fill in the notes at the bottom of the page.</Label>
          <Label testID="form-result">{result}</Label>
        </View>
        <Label>Notes</Label>
        <TextInput testID="form-notes" style={styles.input} value={notes} onChangeText={setNotes} autoCorrect={false} />
        <Button testID="form-submit" title="Submit" onPress={() => setResult(`Submitted: ${notes}`)} />
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, justifyContent: 'flex-end', paddingBottom: 32 },
  spacer: { flex: 1, gap: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16 },
});
