// S22 本地通知
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S22 本地通知', async ({ app }) => {
  // 前置：通知权限已授权。Android：预先授予。iOS：模拟器不能预先授予，也不能用 simctl 重置（Quiesco 的 reset 会重装 app），
  // 本模拟器上已授权过且不随 app 数据清除 → 依赖这一状态（全新模拟器首次运行时需先手动允许一次）
  if (app.platform === 'android') await app.device.setPermission('notifications', 'grant');
  await login(app);
  await app.tap('tab-settings');
  await app.tap('notify-in-3s');
  await app.device.sendToBackground();
  // 从系统通知中心点击（iOS：横幅或通知中心；Android：通知栏）
  // [W2] Android：openNotification 在通知栏里只找 5 秒（写死，不受 timeoutMs 影响；iOS 为 10 秒），通知在切到后台后约 5 秒才发出，
  //      时间刚好踩线（诊断版 Android 失败）。通知不以横幅出现，system.expectVisible 等不到（实测）→ 找不到时再试一次
  for (let attempt = 1; ; attempt++) {
    try {
      await app.device.openNotification('Hello from rnshootout');
      break;
    } catch (e) {
      if (app.platform !== 'android' || attempt >= 3) throw e;
    }
  }
  await app.expectText('notification-target', 'Opened from notification');
});
