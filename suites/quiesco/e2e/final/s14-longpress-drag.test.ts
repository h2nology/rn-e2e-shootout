// S14 长按菜单与拖拽排序
import { login, test } from '../support';

test('S14 长按菜单与拖拽排序', async ({ app }) => {
  await login(app);
  await app.longPress('item-row-3');
  await app.tap('menu-pin');
  await app.expectText('list-top-title', 'Top: Item 003');
  await app.tap('tab-explore');
  await app.tap('open-reorder');
  await app.drag('reorder-handle-R5', 'reorder-row-R1');
  await app.expectText('reorder-summary', 'R5,R1,R2,R3,R4,R6,R7,R8,R9,R10');
});
