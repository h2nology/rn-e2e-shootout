// S21 深链接：WDIO browser.deepLink（iOS mobile: deepLink / Android mobile: deepLink）。
// Appium 的会话独立于 app 进程，冷启动同样可以用这个 API。
import { resetApp, login, byId, sendToBackground, terminate, BUNDLE } from '../support.js';

describe('S21', () => {
  beforeEach(resetApp);
  it('热启动与冷启动打开深链接', async () => {
    await login();
    await sendToBackground();
    await driver.deepLink('rnshootout://item/123', BUNDLE);
    await expect(byId('item-detail-title')).toHaveText('Item 123');
    await terminate();
    await driver.deepLink('rnshootout://item/77', BUNDLE);
    await expect(byId('item-detail-title')).toHaveText('Item 077');
  });
});
