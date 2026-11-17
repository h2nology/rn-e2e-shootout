// A20：点击通知 / 推送后打开的页面
import { useLocalSearchParams } from 'expo-router';
import { Label, Screen } from '@/components/ui';

export default function NotificationTarget() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <Screen>
      <Label testID="notification-target">{from === 'push' ? 'Opened from push' : 'Opened from notification'}</Label>
    </Screen>
  );
}
