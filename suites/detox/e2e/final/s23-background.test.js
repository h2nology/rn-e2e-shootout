// S23 前后台切换与持久化
const { resetApp, login } = require('../support');

describe('S23', () => {
  beforeEach(resetApp);
  it('草稿在前后台切换后保持，保存后重启仍在', async () => {
    await login();
    await element(by.id('add-item-button')).tap();
    await element(by.id('new-item-title')).typeText('Draft text');
    await device.sendToHome();
    await device.launchApp({ newInstance: false });
    await expect(element(by.id('new-item-title'))).toHaveText('Draft text');
    await element(by.id('new-item-title')).replaceText('Persisted');
    await element(by.id('new-item-save')).tap();
    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    await expect(element(by.id('list-top-title'))).toHaveText('Top: Persisted');
  });
});
