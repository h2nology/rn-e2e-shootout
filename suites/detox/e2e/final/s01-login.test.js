// S1 登录成功后进入列表
const { resetApp, login } = require('../support');

describe('S1', () => {
  beforeEach(async () => {
    await resetApp();
  });

  it('登录成功后进入列表', async () => {
    await login();
    await expect(element(by.id('item-list'))).toBeVisible();
    await expect(element(by.id('item-row-1'))).toBeVisible();
    await expect(element(by.text('Top: Item 001'))).toBeVisible();
  });
});
