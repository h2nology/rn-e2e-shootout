// S9 WebView
const { resetApp, login } = require('../support');

describe('S9', () => {
  beforeEach(resetApp);
  it('点击 WebView 内按钮，原生侧显示结果', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-webview')).tap();
    const page = web(by.id('webview'));
    await expect(page.element(by.web.id('ready'))).toHaveText('Web page ready');
    await page.element(by.web.id('send')).tap();
    await expect(element(by.id('webview-result'))).toHaveText('Received: hello');
  });
});
