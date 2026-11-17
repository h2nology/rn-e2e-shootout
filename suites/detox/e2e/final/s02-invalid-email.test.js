// S2 错误邮箱的校验提示
const { resetApp } = require('../support');

describe('S2', () => {
  beforeEach(resetApp);
  it('输入错误邮箱时出现校验提示', async () => {
    await element(by.id('login-email')).typeText('not-an-email');
    await element(by.id('login-password')).typeText('Passw0rd!');
    await element(by.id('login-submit')).tap();
    await expect(element(by.id('login-email-error'))).toHaveText('Invalid email');
    await expect(element(by.id('item-list'))).not.toExist();
  });
});
