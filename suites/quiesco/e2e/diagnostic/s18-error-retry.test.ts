// S18 错误态与重试
import { login, postJson, reset, test } from '../support';

test.beforeEach(reset);

test('S18 错误态与重试', async ({ app }) => {
  await login(app);
  await postJson('/test/fail', { route: '/items', status: 500, count: 1 });
  await app.tap('list-reload');
  await app.expectVisible('error-view');
  await app.expectVisible({ text: 'Something went wrong' });
  await app.tap('error-retry');
  await app.expectVisible('item-row-1');
});
