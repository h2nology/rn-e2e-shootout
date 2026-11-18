// S16 轮询与 WebSocket
import { resetApp, login, byId, tap, isIOS, typeText } from '../support.js';

describe('S16', () => {
  beforeEach(resetApp);
  it('在有轮询和 WebSocket 的页面上提交表单', async () => {
    await login();
    // [X] UiAutomator2 在每个命令前等待界面空闲（waitForIdleTimeout，默认 10 s）；1 秒轮询 + WebSocket 推送使界面永不空闲，
    //     诊断版中每个命令都卡住直到超时。只在本场景的会话内关闭（每个 spec 文件一个会话）。
    if (!isIOS()) await driver.updateSettings({ waitForIdleTimeout: 0 });
    await tap('tab-explore');
    await tap('open-live');
    await typeText(byId('live-name'), 'Alice');
    await tap('live-submit');
    await expect(byId('live-greeting')).toHaveText('Hello, Alice');
  });
});
