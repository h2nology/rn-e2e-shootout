// S22 本地通知
import { login, test } from '../support';

test('S22 本地通知', async ({ app }) => {
  // 前置：通知权限已授权 → quiesco.config.mts 的 permissions: ['notifications']（会话开始时预先授予，0.13.4 起 iOS 也支持，#113）
  await login(app);
  await app.tap('tab-settings');
  await app.tap('notify-in-3s');
  await app.device.sendToBackground();
  // 从系统通知中心点击（iOS：横幅或通知中心；Android：通知栏）。默认最多找 10 秒
  await app.device.openNotification('Hello from rnshootout');
  await app.expectText('notification-target', 'Opened from notification');
});
