// S11 永不静止的动画（诊断版：不做任何同步绕过）
const { resetApp, login } = require('../support');

describe('S11', () => {
  beforeEach(resetApp);
  it('在有无限动画的页面上点击按钮', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-busy-animation')).tap();
    await element(by.id('busy-tap')).tap();
    await expect(element(by.id('busy-result'))).toHaveText('Tapped 1');
  });
});
