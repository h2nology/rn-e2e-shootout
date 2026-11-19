// S17 自动消失的 Toast
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S17 自动消失的 Toast', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('settings-save');
  await app.expectText('toast', 'Saved');
  await app.expectNotExists('toast');
});
