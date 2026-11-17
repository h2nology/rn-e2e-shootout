// S12 左滑删除
const { resetApp, login } = require('../support');

describe('S12', () => {
  beforeEach(resetApp);
  it('左滑后点删除，条目消失', async () => {
    await login();
    await element(by.id('item-row-1')).swipe('left', 'fast', 0.6);
    await element(by.id('swipe-delete-1')).tap();
    await expect(element(by.id('item-row-1'))).not.toExist();
    await expect(element(by.id('list-top-title'))).toHaveText('Top: Item 002');
  });
});
