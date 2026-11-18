// S2 错误邮箱的校验提示
import { resetApp, byId, tap, typeText } from '../support.js';

describe('S2', () => {
  beforeEach(resetApp);
  it('输入错误邮箱时出现校验提示', async () => {
    await typeText(byId('login-email'), 'not-an-email');
    await typeText(byId('login-password'), 'Passw0rd!');
    await tap('login-submit');
    await expect(byId('login-email-error')).toHaveText('Invalid email');
    await expect(byId('item-list')).not.toExist();
  });
});
