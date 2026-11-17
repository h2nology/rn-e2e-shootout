// A18：底部输入框会被键盘遮挡，页面依靠 KeyboardAvoidingView 上移
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, colors, Label } from '@/components/ui';

export default function LongForm() {
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <Pressable style={styles.container} onPress={Keyboard.dismiss} accessible={false}>
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
