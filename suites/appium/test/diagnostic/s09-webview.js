// S9 WebView。不切换到 WEBVIEW 上下文：iOS 需要 app 开启 webviewDebuggingEnabled（改 app），
// Android 需要 chromedriver 与 WebView 调试。网页内容同样出现在原生无障碍树中，按可见文字定位。
import { resetApp, login, byId, byText, tap } from '../support.js';

describe('S9', () => {
  beforeEach(resetApp);
  it('点击 WebView 内按钮，原生侧显示结果', async () => {
    await login();
    await tap('tab-explore');
    await tap('open-webview');
    await expect(byText('Web page ready')).toExist();
    // iOS：WKWebView 内的元素用 click 不触发网页的 click 事件（实测），element.tap() 发送真实触摸（mobile: tap）
    await byText('Send to native').tap();
    await expect(byId('webview-result')).toHaveText('Received: hello');
  });
});
