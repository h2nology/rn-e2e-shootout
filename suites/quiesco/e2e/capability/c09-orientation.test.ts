// C9 横竖屏
import type { Driver } from '@quiesco/core';
import { login, test } from '../support';

async function openSystem(app: Driver) {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-system');
}

test('C9 横竖屏', async ({ app }) => {
  await openSystem(app);
  await app.device.setOrientation('landscape');
  await app.expectText('orientation-indicator', 'landscape');
  await app.device.setOrientation('portrait');
  await app.expectText('orientation-indicator', 'portrait');
});
