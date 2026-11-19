// S20 键盘遮挡
import { login, test } from '../support';

test('S20 键盘遮挡', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-long-form');
  await app.type('form-notes', 'note');
  await app.dismissKeyboard();
  await app.tap('form-submit');
  await app.expectText('form-result', 'Submitted: note');
});
