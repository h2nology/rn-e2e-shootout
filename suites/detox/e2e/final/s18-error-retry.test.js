// S18 错误态与重试
const { resetApp, login, postJson } = require('../support');

describe('S18', () => {
  beforeEach(resetApp);
  it('500 后显示错误页，重试后恢复', async () => {
    await login();
    await postJson('/test/fail', { route: '/items', status: 500, count: 1 });
    await element(by.id('list-reload')).tap();
    await expect(element(by.id('error-view'))).toBeVisible();
    await expect(element(by.text('Something went wrong'))).toBeVisible();
    await element(by.id('error-retry')).tap();
    await expect(element(by.id('item-row-1'))).toBeVisible();
  });
});
