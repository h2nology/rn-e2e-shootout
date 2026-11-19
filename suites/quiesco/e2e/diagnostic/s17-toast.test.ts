// S17 自动消失的 Toast
import { login, test } from '../support';

test('S17 自动消失的 Toast', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('settings-save');
  await app.expectText('toast', 'Saved');
  await app.expectNotExists('toast');
});
