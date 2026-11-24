// S21 深链接：WDIO browser.deepLink（iOS mobile: deepLink / Android mobile: deepLink）。
// Appium 的会话独立于 app 进程，冷启动同样可以用这个 API。
import { resetApp, login, byId, sendToBackground, terminate, BUNDLE } from '../support.js';

describe('S21', () => {
  beforeEach(resetApp);
  it('热启动与冷启动打开深链接', async () => {
    await login();
    // W3（WAITS.md #15）：等登录完成、Home 的列表显示。login() 点完登录按钮即返回；登录请求完成后 app 执行
    // router.replace('/')，若此时深链接已打开详情页会被换回 Home（Android 无窗口模拟器实测 0/4）
    await byId('item-row-1').waitForDisplayed();
    await sendToBackground();
    await driver.deepLink('rnshootout://item/123', BUNDLE);
    await expect(byId('item-detail-title')).toHaveText('Item 123');
    await terminate();
    await driver.deepLink('rnshootout://item/77', BUNDLE);
    await expect(byId('item-detail-title')).toHaveText('Item 077');
  });
});
