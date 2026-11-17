// A17：底部 Tab。未登录时跳转到登录页。
import { Redirect, Tabs } from 'expo-router';
import { useStore } from '@/lib/store';

export default function TabsLayout() {
  const token = useStore((s) => s.token);
  const restored = useStore((s) => s.restored);
  if (!restored) return null; // 原生 splash 仍覆盖在上面
  if (!token) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={{ tabBarIconStyle: { display: 'none' }, tabBarLabelStyle: { fontSize: 15 } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarButtonTestID: 'tab-home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', headerShown: false, tabBarButtonTestID: 'tab-explore' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarButtonTestID: 'tab-settings' }} />
    </Tabs>
  );
}
