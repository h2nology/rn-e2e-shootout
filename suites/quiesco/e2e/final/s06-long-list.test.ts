// S6 长列表滚动到第 400 行
import { login, reset, test } from '../support';

test.beforeEach(reset);

// [W3] 单测超时 120 s（vitest.config.mts）→ 300 s：滚到第 400 行需要数十次滑动，重启后第一轮的 Android 模拟器上超过 120 s（实测 1 / 5）
test('S6 长列表滚动到第 400 行', { timeout: 300_000 }, async ({ app }) => {
  await login(app);
  // scrollTo：在列表上做滚动手势直到目标行出现（scrollToIndex 调用 app 内部方法，场景禁止）
  if (app.platform === 'ios') {
    // [W3] scrollTo 整个调用默认 10 s 超时（sync.timeoutMs），滚到第 400 行需要数十次滑动（诊断版 SYNC_TIMEOUT）→ 放宽到 300 s
    await app.scrollTo('item-list', 'item-row-400', { timeoutMs: 300_000 });
  } else {
    // [W2] Android：Quiesco 0.7.0 的 scrollTo 在带 RefreshControl 的列表上误判“已到两端”——RN 在 Android 上用
    //      AndroidSwipeRefreshLayout 包住 ScrollView，agent 把这层包装当作滚动视图，测到的偏移恒为 0，拖一次就放弃（实测、读源码确认）。
    //      → 自己重复真实的滚动手势（scroll() 每次之后都等 app 空闲），直到目标行可见；上限 120 次
    for (let i = 0; i < 120; i++) {
      if ((await app.query('item-row-400')).some((e) => e.visible)) break;
      await app.scroll('item-list', 'down');
    }
  }
  // [W2] scrollTo / 上面的循环在目标行露出一条细边时就停下，而 tap 瞄准整行矩形的中心，可能落在列表外（标题栏上）；
  //      Quiesco 的遮挡检查不考虑祖先的裁剪，点击“成功”却没点到行（iOS 5 轮中 2 次，读 agent 源码确认）。
  //      → 行没有完全显示时，再做一次真实拖动把它拉进列表，断言完全可见后再点
  const [row] = await app.query('item-row-400');
  const [list] = await app.query('item-list');
  if (row.visibleRatio < 1) {
    await app.scroll('item-list', row.rect!.y < list.rect!.y ? 'up' : 'down', { distance: row.rect!.height * 2 });
  }
  await app.expectVisible('item-row-400', { ratio: 1 });
  await app.tap('item-row-400');
  await app.expectText('item-detail-title', 'Item 400');
});
