// S2 错误邮箱的校验提示
import { reset, test } from '../support';

test.beforeEach(reset);

test('S2 错误邮箱的校验提示', async ({ app }) => {
  await app.type('login-email', 'not-an-email');
  await app.type('login-password', 'Passw0rd!');
  await app.tap('login-submit');
  await app.expectText('login-email-error', 'Invalid email');
  await app.expectNotExists('item-list');
});
