// A22 跨 app（OAuth 式登录、系统分享面板）、A28 深色模式 / 横竖屏指示
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Share, useColorScheme, useWindowDimensions } from 'react-native';
import { Button, Label, Screen } from '@/components/ui';
import { API_URL } from '@/lib/api';

export default function System() {
  const scheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [oauth, setOauth] = useState('Signed out');
  const [share, setShare] = useState('Idle');

  async function oauthLogin() {
    const redirect = Linking.createURL('auth');
    const url = `${API_URL}/oauth/authorize?redirect_uri=${encodeURIComponent(redirect)}`;
    const r = await WebBrowser.openAuthSessionAsync(url, redirect);
    if (r.type === 'success') {
      const user = Linking.parse(r.url).queryParams?.user;
      setOauth(`Signed in as ${user}`);
    } else {
      setOauth('Cancelled');
    }
  }

  return (
    <Screen>
      <Button testID="oauth-login" title="Sign in with Mock OAuth" onPress={oauthLogin} />
      <Label testID="oauth-status">{oauth}</Label>
      <Button
        testID="share-button"
        title="Share"
        onPress={async () => {
          await Share.share({ message: 'Hello from rnshootout' }).catch(() => undefined);
          setShare('Share dismissed');
        }}
      />
      <Label testID="share-status">{share}</Label>
      <Label testID="theme-indicator">{scheme === 'dark' ? 'dark' : 'light'}</Label>
      <Label testID="orientation-indicator">{width > height ? 'landscape' : 'portrait'}</Label>
    </Screen>
  );
}
