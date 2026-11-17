// A9：WebView 内的按钮把消息发回原生侧
import { useState } from 'react';
import { View } from 'react-native';
import { WebFrame } from '@/components/web-frame';
import { Label, Screen } from '@/components/ui';
import { API_URL } from '@/lib/api';

export default function WebViewScreen() {
  const [result, setResult] = useState('Waiting');
  return (
    <Screen>
      <Label testID="webview-result">{result}</Label>
      <View style={{ flex: 1 }}>
        <WebFrame uri={`${API_URL}/webview`} onMessage={(m) => setResult(`Received: ${m}`)} />
      </View>
    </Screen>
  );
}
