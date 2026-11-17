// S15 Reanimated 动画
const { resetApp, login } = require('../support');

describe('S15', () => {
  beforeEach(resetApp);
  it('卡片展开后点击卡片内按钮', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-reanimated')).tap();
    await element(by.id('rea-card')).tap();
    // [W3] Android 上 Detox 不等待 Reanimated（UI 线程）的弹簧动画结束（iOS 会等，实测）
    await waitFor(element(by.id('rea-card-action'))).toBeVisible().withTimeout(5000);
    await element(by.id('rea-card-action')).tap();
    await expect(element(by.id('rea-result'))).toHaveText('Action done');
  });
});
