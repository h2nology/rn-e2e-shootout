import { WebView } from 'react-native-webview';

export function WebFrame({ uri, onMessage }: { uri: string; onMessage: (m: string) => void }) {
  return <WebView testID="webview" source={{ uri }} onMessage={(e) => onMessage(e.nativeEvent.data)} style={{ flex: 1 }} />;
}
