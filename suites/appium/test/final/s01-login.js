// S1 登录成功后进入列表
import { resetApp, login, byId } from '../support.js';

describe('S1', () => {
  beforeEach(resetApp);

  it('登录成功后进入列表', async () => {
    await login();
    await expect(byId('item-list')).toBeDisplayed();
    await expect(byId('item-row-1')).toBeDisplayed();
    await expect(byId('list-top-title')).toHaveText('Top: Item 001');
  });
});
