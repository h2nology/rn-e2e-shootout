// S4 新增条目并在刷新后保留
import { login, test } from '../support';

test('S4 新增条目并在刷新后保留', async ({ app }) => {
  await login(app);
  await app.tap('add-item-button');
  await app.type('new-item-title', 'New task');
  await app.tap('new-item-save');
  await app.expectText('list-top-title', 'Top: New task');
  await app.tap('list-reload');
  await app.expectText('list-top-title', 'Top: New task');
});
