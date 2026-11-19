// S22 本地通知
import { login, test } from '../support';

test('S22 本地通知', async ({ app }) => {
  // 前置：通知权限已授权。Android：预先授予。iOS：模拟器不能预先授予，也不能用 simctl 重置（Quiesco 的 reset 会重装 app），
  // 本模拟器上已授权过且不随 app 数据清除 → 依赖这一状态（全新模拟器首次运行时需先手动允许一次）
  if (app.platform === 'android') await app.device.setPermission('notifications', 'grant');
  await login(app);
  await app.tap('tab-settings');
  await app.tap('notify-in-3s');
  await app.device.sendToBackground();
  // 从系统通知中心点击（iOS：横幅或通知中心；Android：通知栏）。默认最多找 10 秒
  await app.device.openNotification('Hello from rnshootout');
  await app.expectText('notification-target', 'Opened from notification');
});
