// C2：OAuth 回跳页（rnshootout://auth?user=...）。
// - Web：弹窗内完成认证会话。
// - 原生：结果已由 openAuthSessionAsync 返回给发起页；Android 上 Expo Router 还会把回跳 URL
//   当作深链接打开本页，因此立即返回发起页，避免盖住结果。
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Label, Screen } from '@/components/ui';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  return (
    <Screen>
      <Label>Completing sign-in…</Label>
    </Screen>
  );
}
