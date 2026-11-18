// S11 永不静止的动画
import { resetApp, login, byId, tap } from '../support.js';

describe('S11', () => {
  beforeEach(resetApp);
  it('在有无限动画的页面上点击按钮', async () => {
    await login();
    await tap('tab-explore');
    await tap('open-busy-animation');
    await tap('busy-tap');
    await expect(byId('busy-result')).toHaveText('Tapped 1');
  });
});
