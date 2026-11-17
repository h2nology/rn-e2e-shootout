// A10：系统权限弹窗（定位）
import * as Location from 'expo-location';
import { useState } from 'react';
import { Button, Label, Screen } from '@/components/ui';

export default function Permission() {
  const [status, setStatus] = useState('Unknown');
  return (
    <Screen>
      <Button
        testID="request-location"
        title="Request location permission"
        onPress={async () => {
          const r = await Location.requestForegroundPermissionsAsync();
          setStatus(r.granted ? 'Granted' : 'Denied');
        }}
      />
      <Label testID="permission-status">{status}</Label>
    </Screen>
  );
}
