// S10b 点击系统弹窗“允许”
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S10b 点击系统弹窗“允许”', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-permission');
  await app.tap('request-location');
  if (app.platform === 'ios') await app.device.system.tap({ text: 'Allow While Using App' });
  else await app.device.system.tap({ id: 'permission_allow_foreground_only_button' });
  await app.expectText('permission-status', 'Granted');
});
