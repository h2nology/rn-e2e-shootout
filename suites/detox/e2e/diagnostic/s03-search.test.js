// S3 防抖搜索
const { resetApp, login } = require('../support');

describe('S3', () => {
  beforeEach(resetApp);
  it('搜索关键字后只显示匹配项', async () => {
    await login();
    await element(by.id('search-input')).typeText('Item 04');
    await expect(element(by.id('search-count'))).toHaveText('10 results');
    await expect(element(by.id('item-row-40'))).toExist();
    await expect(element(by.id('item-row-49'))).toExist();
    await expect(element(by.id('item-row-1'))).not.toExist();
  });
});
