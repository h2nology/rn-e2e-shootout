// A27：远程图片（服务端延迟 1.5 秒返回）
import { Image } from 'expo-image';
import { useState } from 'react';
import { Label, Screen } from '@/components/ui';
import { API_URL } from '@/lib/api';

export default function RemoteImage() {
  const [status, setStatus] = useState('Loading');
  return (
    <Screen>
      <Image
        testID="remote-image"
        source={{ uri: `${API_URL}/image.png` }}
        cachePolicy="none"
        style={{ width: 128, height: 128 }}
        onLoad={() => setStatus('Loaded')}
        onError={() => setStatus('Error')}
      />
      <Label testID="image-status">{status}</Label>
    </Screen>
  );
}
