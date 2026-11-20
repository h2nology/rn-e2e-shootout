// S6 长列表滚动到第 400 行
import { login, test } from '../support';

// [W3] 单测超时 120 s（vitest.config.mts）→ 300 s：滚到第 400 行需要数十次真实拖动，模拟器较慢时接近 120 s
test('S6 长列表滚动到第 400 行', { timeout: 300_000 }, async ({ app }) => {
  await login(app);
  // scrollTo：在列表上做滚动手势直到目标行的中心露出（scrollToIndex 调用 app 内部方法，场景禁止）
  // [W3] scrollTo 每一步的空闲等待默认 10 s（0.9.0 起每步单独计时）→ 30 s：Android（CPU 渲染的模拟器）上快速拖动后
  //      FlatList 逐批渲染新行（50 ms 定时器 + React 提交，元素树 4000+ 节点），一步之后的空闲可能超过 10 s（诊断版实测）
  await app.scrollTo('item-list', 'item-row-400', { timeoutMs: 30_000 });
  await app.tap('item-row-400');
  await app.expectText('item-detail-title', 'Item 400');
});
