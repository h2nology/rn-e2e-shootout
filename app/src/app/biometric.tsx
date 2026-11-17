// A21：生物识别解锁
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { Button, Label, Screen } from '@/components/ui';

export default function Biometric() {
  const [status, setStatus] = useState('Locked');
  return (
    <Screen>
      <Button
        testID="biometric-unlock"
        title="Unlock"
        onPress={async () => {
          const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock rnshootout', disableDeviceFallback: true });
          setStatus(r.success ? 'Unlocked' : 'Failed');
        }}
      />
      <Label testID="biometric-status">{status}</Label>
    </Screen>
  );
}
