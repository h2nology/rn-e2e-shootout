// S13 下拉刷新（browser.swipe 在列表内从上往下滑）
import { resetApp, login, byId, postJson } from '../support.js';

describe('S13', () => {
  beforeEach(resetApp);
  it('下拉刷新后显示服务端新增的数据', async () => {
    await login();
    // [W3] 等首次加载完成：$() 本身不等待（iOS 实测 Malformed elementId），且首次加载未完成时新增的数据会被它直接带出，
    //      不能证明下拉刷新生效
    await byId('item-row-1').waitForDisplayed();
    const list = await byId('item-list');
    await postJson('/test/items', { title: 'Server item' });
    await driver.swipe({ direction: 'down', scrollableElement: list, percent: 0.6 });
    await expect(byId('list-top-title')).toHaveText('Top: Server item');
  });
});
