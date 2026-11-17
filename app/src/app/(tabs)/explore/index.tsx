import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Label, Screen } from '@/components/ui';

export default function Explore() {
  const [count, setCount] = useState(0);
  return (
    <Screen>
      <View style={styles.row}>
        <Button testID="explore-counter" title="Count +1" onPress={() => setCount((c) => c + 1)} />
        <Label testID="explore-counter-value">{String(count)}</Label>
      </View>
      <Button testID="open-explore-detail" title="Explore detail" onPress={() => router.push('/explore/detail')} />
      <Button testID="open-webview" title="WebView" onPress={() => router.push('/webview')} />
      <Button testID="open-busy-animation" title="Busy animation" onPress={() => router.push('/busy')} />
      <Button testID="open-reanimated" title="Reanimated" onPress={() => router.push('/reanimated')} />
      <Button testID="open-live" title="Live (polling + WebSocket)" onPress={() => router.push('/live')} />
      <Button testID="open-reorder" title="Reorder" onPress={() => router.push('/reorder')} />
      <Button testID="open-dup" title="Selectors" onPress={() => router.push('/dup')} />
      <Button testID="open-nested" title="Nested scroll" onPress={() => router.push('/nested')} />
      <Button testID="open-image" title="Remote image" onPress={() => router.push('/image')} />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 16 } });
