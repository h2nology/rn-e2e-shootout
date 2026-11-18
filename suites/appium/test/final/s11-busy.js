// S11 永不静止的动画
import { resetApp, login, byId, tap, isIOS } from '../support.js';

describe('S11', () => {
  beforeEach(resetApp);
  it('在有无限动画的页面上点击按钮', async () => {
    await login();
    // [X] UiAutomator2 在每个命令前等待界面空闲（waitForIdleTimeout，默认 10 s）；无限动画使界面永不空闲，
    //     诊断版中每个命令都卡住直到超时。只在本场景的会话内关闭（每个 spec 文件一个会话）。
    if (!isIOS()) await driver.updateSettings({ waitForIdleTimeout: 0 });
    await tap('tab-explore');
    await tap('open-busy-animation');
    await tap('busy-tap');
    await expect(byId('busy-result')).toHaveText('Tapped 1');
  });
});
