// S2 错误邮箱的校验提示
import { resetApp, byId, tap } from '../support.js';

describe('S2', () => {
  beforeEach(resetApp);
  it('输入错误邮箱时出现校验提示', async () => {
    await byId('login-email').setValue('not-an-email');
    await byId('login-password').setValue('Passw0rd!');
    await tap('login-submit');
    await expect(byId('login-email-error')).toHaveText('Invalid email');
    await expect(byId('item-list')).not.toExist();
  });
});
