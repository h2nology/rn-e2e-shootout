import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { useToast } from '@/components/toast';
import { Button, Screen } from '@/components/ui';

export default function Settings() {
  const toast = useToast();

  async function notifyIn3s() {
    // A20：3 秒后发出本地通知（权限由测试预先授权，见 scenarios.md S22）。
    // 与真实 app 一样，发送前确认权限；未授权时弹出系统权限请求。
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) {
      const requested = await Notifications.requestPermissionsAsync();
      if (!requested.granted) return;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Hello from rnshootout', data: { target: 'notification' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'default' },
    });
  }

  return (
    <Screen>
      <Button testID="settings-save" title="Save settings" onPress={() => toast('Saved')} />
      <Button testID="open-controls" title="Controls" onPress={() => router.push('/controls')} />
      <Button testID="open-permission" title="Permission" onPress={() => router.push('/permission')} />
      <Button testID="open-long-form" title="Long form" onPress={() => router.push('/long-form')} />
      {Platform.OS !== 'web' && <Button testID="notify-in-3s" title="Notify in 3 s" onPress={notifyIn3s} />}
      <Button testID="open-biometric" title="Biometric" onPress={() => router.push('/biometric')} />
      <Button testID="open-system" title="System (OAuth, share, theme)" onPress={() => router.push('/system')} />
    </Screen>
  );
}
