// S16 轮询与 WebSocket（诊断版：不做任何同步绕过）
const { resetApp, login } = require('../support');

describe('S16', () => {
  beforeEach(resetApp);
  it('在有轮询和 WebSocket 的页面上提交表单', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-live')).tap();
    await element(by.id('live-name')).typeText('Alice');
    await element(by.id('live-submit')).tap();
    await expect(element(by.id('live-greeting'))).toHaveText('Hello, Alice');
  });
});
