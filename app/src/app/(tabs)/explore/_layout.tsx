// A17：Explore Tab 内嵌套的 Stack
import { Stack } from 'expo-router';
import { duration } from '@/lib/anim';

export default function ExploreLayout() {
  return (
    <Stack screenOptions={{ animationDuration: duration(350) }}>
      <Stack.Screen name="index" options={{ title: 'Explore' }} />
      <Stack.Screen name="detail" options={{ title: 'Explore detail' }} />
    </Stack>
  );
}
