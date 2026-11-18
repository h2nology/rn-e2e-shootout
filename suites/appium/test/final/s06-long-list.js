// S6 长列表滚动到第 400 行（WDIO 惯用写法：element.scrollIntoView 在指定容器内边滑动边查找）
import { resetApp, login, byId, tap } from '../support.js';

describe('S6', function () {
  // [W3] mocha 默认 60 s；滑动到第 400 行需要数十次滑动（每次默认 1.5 s），放宽到 300 s
  this.timeout(300000);
  beforeEach(resetApp);
  it('滚动到第 400 行并进入详情', async () => {
    await login();
    // [W3] $() 本身不等待：登录后列表尚未渲染时取到的是不存在的元素（诊断版 iOS 实测 Malformed elementId）
    const list = await byId('item-list');
    await list.waitForDisplayed();
    // 默认 maxScrolls = 10 不够到第 400 行。percent 0.8：每次滑动小于一屏，目标行不会在两次检查之间被滑过；
    // duration 1000 ms（默认 1500）：缩短耗时，且不至于触发惯性滚动（iOS 默认参数下本场景约 300 s）
    await byId('item-row-400').scrollIntoView({ scrollableElement: list, maxScrolls: 100, percent: 0.8, duration: 1000 });
    await tap('item-row-400');
    await expect(byId('item-detail-title')).toHaveText('Item 400');
  });
});
