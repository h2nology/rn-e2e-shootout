// C8 深色模式
import type { Driver } from '@quiesco/core';
import { login, reset, test } from '../support';

test.beforeEach(reset);

async function openSystem(app: Driver) {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-system');
}

test('C8 深色模式', async ({ app }) => {
  await openSystem(app);
  await app.expectText('theme-indicator', 'light');
  await app.device.setAppearance('dark');
  await app.expectText('theme-indicator', 'dark');
  await app.device.setAppearance('light');
  await app.expectText('theme-indicator', 'light');
});
