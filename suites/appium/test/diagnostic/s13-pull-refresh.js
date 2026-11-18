// S13 下拉刷新（browser.swipe 在列表内从上往下滑）
import { resetApp, login, byId, postJson } from '../support.js';

describe('S13', () => {
  beforeEach(resetApp);
  it('下拉刷新后显示服务端新增的数据', async () => {
    await login();
    await postJson('/test/items', { title: 'Server item' });
    await driver.swipe({ direction: 'down', scrollableElement: await byId('item-list'), percent: 0.6 });
    await expect(byId('list-top-title')).toHaveText('Top: Server item');
  });
});
