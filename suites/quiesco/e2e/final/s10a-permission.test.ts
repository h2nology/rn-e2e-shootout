// S10a 预先授权后显示 Granted
import { login, test } from '../support';

test('S10a 预先授权后显示 Granted', async ({ app }) => {
  await app.device.setPermission('location', 'grant');
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-permission');
  await app.tap('request-location');
  await app.expectText('permission-status', 'Granted');
});
