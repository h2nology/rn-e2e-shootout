// S17 自动消失的 Toast
const { resetApp, login } = require('../support');

describe('S17', () => {
  beforeEach(resetApp);
  it('Toast 出现后消失', async () => {
    await login();
    await element(by.id('tab-settings')).tap();
    await element(by.id('settings-save')).tap();
    await expect(element(by.id('toast'))).toHaveText('Saved');
    // [W3] Toast 2 秒后才消失（定时器超过 Detox 的跟踪阈值，同步不会等它）
    await waitFor(element(by.id('toast'))).not.toExist().withTimeout(5000);
  });
});
