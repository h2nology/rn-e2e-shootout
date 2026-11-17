// S9 WebView
const { resetApp, login } = require('../support');

describe('S9', () => {
  beforeEach(resetApp);
  it('点击 WebView 内按钮，原生侧显示结果', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-webview')).tap();
    // 页面上只有一个 WebView，用 Detox 的默认 web 匹配。
    // 在 Android 上 web(by.id('webview')) 匹配到的是 RN 的外层容器，不满足操作约束（实测）。
    const page = web;
    await expect(page.element(by.web.id('ready'))).toHaveText('Web page ready');
    await page.element(by.web.id('send')).tap();
    await expect(element(by.id('webview-result'))).toHaveText('Received: hello');
  });
});
