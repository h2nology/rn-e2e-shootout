// S1 登录成功后进入列表
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S1 登录成功后进入列表', async ({ app }) => {
  await login(app);
  await app.expectVisible('item-list');
  await app.expectText('item-row-1', /Item 001/);
  await app.expectText('list-top-title', 'Top: Item 001');
});
