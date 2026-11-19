// S12 左滑删除
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S12 左滑删除', async ({ app }) => {
  await login(app);
  await app.swipe('item-row-1', 'left');
  await app.tap('swipe-delete-1');
  await app.expectNotExists('item-row-1');
  await app.expectText('list-top-title', 'Top: Item 002');
});
