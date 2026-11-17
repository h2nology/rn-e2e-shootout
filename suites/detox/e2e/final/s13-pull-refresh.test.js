// S13 下拉刷新
const { resetApp, login, postJson } = require('../support');

describe('S13', () => {
  beforeEach(resetApp);
  it('下拉刷新后显示服务端新增的数据', async () => {
    await login();
    await postJson('/test/items', { title: 'Server item' });
    await element(by.id('item-list')).swipe('down', 'slow', 0.6, 0.5, 0.1);
    await expect(element(by.id('list-top-title'))).toHaveText('Top: Server item');
  });
});
