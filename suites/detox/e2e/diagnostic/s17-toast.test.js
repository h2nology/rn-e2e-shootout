// S17 自动消失的 Toast（诊断版）
const { resetApp, login } = require('../support');

describe('S17', () => {
  beforeEach(resetApp);
  it('Toast 出现后消失', async () => {
    await login();
    await element(by.id('tab-settings')).tap();
    await element(by.id('settings-save')).tap();
    await expect(element(by.id('toast'))).toHaveText('Saved');
    await expect(element(by.id('toast'))).not.toExist();
  });
});
