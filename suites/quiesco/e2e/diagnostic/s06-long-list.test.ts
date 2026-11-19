// S6 长列表滚动到第 400 行
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S6 长列表滚动到第 400 行', async ({ app }) => {
  await login(app);
  // scrollTo：在列表上做滚动手势直到目标行出现（scrollToIndex 调用 app 内部方法，场景禁止）
  await app.scrollTo('item-list', 'item-row-400');
  await app.tap('item-row-400');
  await app.expectText('item-detail-title', 'Item 400');
});
