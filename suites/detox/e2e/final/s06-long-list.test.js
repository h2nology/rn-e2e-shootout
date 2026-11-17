// S6 长列表滚动到第 400 行（Detox 惯用写法：waitFor().whileElement().scroll() 边滚动边查找）
const { resetApp, login } = require('../support');

describe('S6', () => {
  beforeEach(resetApp);
  it('滚动到第 400 行并进入详情', async () => {
    await login();
    await waitFor(element(by.id('item-row-400')))
      .toBeVisible()
      .whileElement(by.id('item-list'))
      .scroll(400, 'down'); // 步长小于一屏，避免目标行在两次检查之间被滚过
    await element(by.id('item-row-400')).tap();
    await expect(element(by.id('item-detail-title'))).toHaveText('Item 400');
  });
});
