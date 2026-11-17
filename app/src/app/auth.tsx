// C2（Web）：OAuth 弹窗回调页。原生端由 openAuthSessionAsync 直接拦截重定向，不会进入此页面。
import * as WebBrowser from 'expo-web-browser';
import { Label, Screen } from '@/components/ui';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  return (
    <Screen>
      <Label>Completing sign-in…</Label>
    </Screen>
  );
}
