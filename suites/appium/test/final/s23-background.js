// S23 前后台切换与持久化：mobile: backgroundApp（2 秒后自动回到前台）、mobile: terminateApp、mobile: launchApp / activateApp
import { resetApp, login, byId, tap, sendToBackground, terminate, launch, typeText } from '../support.js';

describe('S23', () => {
  beforeEach(resetApp);
  it('草稿在前后台切换后保持，保存后重启仍在', async () => {
    await login();
    await tap('add-item-button');
    await typeText(byId('new-item-title'), 'Draft text');
    await sendToBackground(2);
    await expect(byId('new-item-title')).toHaveText('Draft text');
    await typeText(byId('new-item-title'), 'Persisted');
    await tap('new-item-save');
    // [W3] Appium 不跟踪 app 的网络请求：立刻结束 app 会切断保存请求（诊断版实测，服务端收到 ECONNRESET）。
    //      服务端确认后临时行才被替换为 #item-row-501，以此为条件等待。
    await byId('item-row-501').waitForExist();
    await terminate();
    await launch();
    await expect(byId('list-top-title')).toHaveText('Top: Persisted');
  });
});
