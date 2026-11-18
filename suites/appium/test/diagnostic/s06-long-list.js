// S6 长列表滚动到第 400 行（WDIO 惯用写法：element.scrollIntoView 在指定容器内边滑动边查找）
import { resetApp, login, byId, tap } from '../support.js';

describe('S6', () => {
  beforeEach(resetApp);
  it('滚动到第 400 行并进入详情', async () => {
    await login();
    // 默认 maxScrolls = 10 不够到第 400 行；percent 小于一屏，避免目标行在两次检查之间被滑过
    await byId('item-row-400').scrollIntoView({ scrollableElement: await byId('item-list'), maxScrolls: 150, percent: 0.5 });
    await tap('item-row-400');
    await expect(byId('item-detail-title')).toHaveText('Item 400');
  });
});
