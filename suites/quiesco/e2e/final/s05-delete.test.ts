// S5 删除条目，确认 Modal
import { login, test } from '../support';

test('S5 删除条目，确认 Modal', async ({ app }) => {
  await login(app);
  await app.tap('item-delete-2');
  await app.expectVisible('confirm-modal');
  await app.tap('confirm-ok');
  await app.expectNotVisible('confirm-modal');
  await app.expectNotExists('item-row-2');
  await app.expectExists('item-row-1');
  await app.expectExists('item-row-3');
});
