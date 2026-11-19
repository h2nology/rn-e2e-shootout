// C11 远程推送
import { execFileSync } from 'node:child_process';
import { login, reset, test } from '../support';

const PUSH_IOS = new URL('../../../../mock-server/scripts/push-ios.sh', import.meta.url).pathname;

test.beforeEach(reset);

test('C11 远程推送', async ({ app }) => {
  // Android：模拟器没有推送服务；Quiesco 的 sendNotification 以 app 身份在本地发出通知（不是远程推送），需通知权限
  if (app.platform === 'android') await app.device.setPermission('notifications', 'grant');
  await login(app);
  await app.expectVisible('item-list');
  await app.device.sendToBackground();
  // 场景规定用 mock server 的辅助脚本发送（iOS：simctl push）。Android：模拟器没有推送服务
  if (app.platform === 'ios') execFileSync('sh', [PUSH_IOS, 'booted']);
  else await app.device.sendNotification({ title: 'Push from rnshootout', body: 'Tap to open', data: { target: 'push' } });
  await app.device.openNotification('Push from rnshootout');
  await app.expectText('notification-target', 'Opened from push');
});
