// S4 新增条目并在刷新后保留
const { resetApp, login } = require('../support');

describe('S4', () => {
  beforeEach(resetApp);
  it('新增条目出现在顶部，刷新后仍在', async () => {
    await login();
    await element(by.id('add-item-button')).tap();
    await element(by.id('new-item-title')).typeText('New task');
    await element(by.id('new-item-save')).tap();
    await expect(element(by.id('list-top-title'))).toHaveText('Top: New task');
    await element(by.id('list-reload')).tap();
    await expect(element(by.id('list-top-title'))).toHaveText('Top: New task');
  });
});
