// S13 下拉刷新
import { login, postJson, reset, test } from '../support';

test.beforeEach(reset);

test('S13 下拉刷新', async ({ app }) => {
  await login(app);
  await app.expectVisible('item-row-1');
  await postJson('/test/items', { title: 'Server item' });
  await app.swipe('item-list', 'down');
  await app.expectText('list-top-title', 'Top: Server item');
});
