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
    const send = byText('Send to native');
    // [W3] iOS：按钮进入无障碍树时网页尚不可交互，立刻点击不生效（实测 0/2，等待显示后 3/3）
    await send.waitForDisplayed();
    // [W2] 等待显示后仍偶发点击无效（单独执行 16 次失败 2 次；全套执行 4 次中失败 2 次）：失败时截图里页面已完全显示、
    //      按钮坐标不变，原因未查明。点完后结果仍为 Waiting 则再点（重复发送 hello 不影响断言）
    const result = byId('webview-result');
    await driver.waitUntil(
      async () => {
        if ((await result.getText()) === 'Received: hello') return true;
        await send.tap();
        return (await result.getText()) === 'Received: hello';
      },
      { timeout: 15000, interval: 1000 },
    );
    await expect(result).toHaveText('Received: hello');
  });
});
