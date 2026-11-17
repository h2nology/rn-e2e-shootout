// A6 新增（乐观更新）、A7 中日文输入、A23 草稿在前后台切换后保持
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Button, colors, Label, Screen } from '@/components/ui';
import { items } from '@/lib/store';

export default function Add() {
  const [title, setTitle] = useState('');
  return (
    <Screen>
      <Label>Title</Label>
      <TextInput testID="new-item-title" style={styles.input} value={title} onChangeText={setTitle} autoCorrect={false} />
      <Button
        testID="new-item-save"
        title="Save"
        disabled={!title}
        onPress={() => {
          items.add(title);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16 },
});
