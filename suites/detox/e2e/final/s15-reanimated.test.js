// S15 Reanimated 动画
const { resetApp, login } = require('../support');

describe('S15', () => {
  beforeEach(resetApp);
  it('卡片展开后点击卡片内按钮', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-reanimated')).tap();
    await element(by.id('rea-card')).tap();
    await element(by.id('rea-card-action')).tap();
    await expect(element(by.id('rea-result'))).toHaveText('Action done');
  });
});
