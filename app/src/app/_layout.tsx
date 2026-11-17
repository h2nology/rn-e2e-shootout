import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '@/components/toast';
import { configureAnimations, duration } from '@/lib/anim';
import { api } from '@/lib/api';
import { auth } from '@/lib/store';

// A26：splash 保持到初始配置（施压配置、登录态）加载完成，且至少 1.5 秒
SplashScreen.preventAutoHideAsync().catch(() => {});
const SPLASH_MIN_MS = 1500;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

function targetOf(response: Notifications.NotificationResponse): string {
  const content = response.notification.request.content;
  const trigger = response.notification.request.trigger as { payload?: { target?: string } } | null;
  return (content.data?.target as string | undefined) ?? trigger?.payload?.target ?? 'notification';
}

function useNotificationRouting(ready: boolean) {
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const open = (r: Notifications.NotificationResponse) =>
      router.push({ pathname: '/notification-target', params: { from: targetOf(r) } });
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [ready]);
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const started = Date.now();
    (async () => {
      try {
        configureAnimations(await api.config());
      } catch {
        // mock server 不可用时使用默认配置
      }
      await auth.restore();
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
        }).catch(() => {});
      }
      const wait = SPLASH_MIN_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  useNotificationRouting(ready);

  // 导航器从一开始就挂载（原生 splash 覆盖到 ready 为止），
  // 这样 splash 期间收到的深链接不会丢失（S21 冷启动）。

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <Stack screenOptions={{ animationDuration: duration(350), headerTransparent: false, headerStyle: { backgroundColor: "#FFFFFF" }, headerBackButtonDisplayMode: "minimal" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Sign in', headerBackVisible: false }} />
          <Stack.Screen name="item/[id]" options={{ title: 'Item' }} />
          <Stack.Screen name="add" options={{ title: 'New item' }} />
          <Stack.Screen name="controls/index" options={{ title: 'Controls' }} />
          <Stack.Screen name="controls/result" options={{ title: 'Result' }} />
          <Stack.Screen name="permission" options={{ title: 'Permission' }} />
          <Stack.Screen name="webview" options={{ title: 'WebView' }} />
          <Stack.Screen name="busy" options={{ title: 'Busy animation' }} />
          <Stack.Screen name="reanimated" options={{ title: 'Reanimated' }} />
          <Stack.Screen name="live" options={{ title: 'Live' }} />
          <Stack.Screen name="reorder" options={{ title: 'Reorder' }} />
          <Stack.Screen name="long-form" options={{ title: 'Long form' }} />
          <Stack.Screen name="notification-target" options={{ title: 'Notification' }} />
          <Stack.Screen name="biometric" options={{ title: 'Biometric' }} />
          <Stack.Screen name="system" options={{ title: 'System' }} />
          <Stack.Screen name="dup" options={{ title: 'Selectors' }} />
          <Stack.Screen name="nested" options={{ title: 'Nested scroll' }} />
          <Stack.Screen name="image" options={{ title: 'Image' }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
