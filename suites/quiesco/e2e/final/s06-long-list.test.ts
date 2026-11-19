// S6 长列表滚动到第 400 行
import { login, test } from '../support';

// [W3] 单测超时 120 s（vitest.config.mts）→ 300 s：滚到第 400 行需要数十次真实拖动，模拟器较慢时接近 120 s
test('S6 长列表滚动到第 400 行', { timeout: 300_000 }, async ({ app }) => {
  await login(app);
  // scrollTo：在列表上做滚动手势直到目标行的中心露出（scrollToIndex 调用 app 内部方法，场景禁止）
  // [W3] scrollTo 整个调用默认 10 s 超时（sync.timeoutMs），滚到第 400 行需要约 37 步（诊断版两平台都超时）→ 放宽到 300 s
  await app.scrollTo('item-list', 'item-row-400', { timeoutMs: 300_000 });
  await app.tap('item-row-400');
  await app.expectText('item-detail-title', 'Item 400');
});
