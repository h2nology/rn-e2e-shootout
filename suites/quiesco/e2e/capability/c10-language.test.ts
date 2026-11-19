// C10 系统语言：日文 / 中文启动
import { test } from '../support';

test('C10 系统语言：日文 / 中文启动', async ({ app }) => {
  // setLocale：iOS 以 -AppleLanguages / -AppleLocale 重新启动 app；Android 为 per-app language（cmd locale set-app-locales）后重新启动
  await app.device.setLocale('ja-JP');
  await app.expectText('login-submit', 'ログイン');
  await app.device.setLocale('zh-CN');
  await app.expectText('login-submit', '登录');
});
