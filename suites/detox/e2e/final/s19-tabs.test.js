// S19 Tab 与嵌套导航
const { resetApp, login } = require('../support');

async function goBack() {
  if (device.getPlatform() === 'android') {
    await device.pressBack();
  } else {
    await element(by.label('Back')).atIndex(0).tap(); // iOS 导航栏返回按钮
  }
}

describe('S19', () => {
  beforeEach(resetApp);
  it('嵌套页返回后 Tab 状态保持', async () => {
    await login();
    await element(by.id('tab-explore')).tap();
    for (let i = 0; i < 3; i++) await element(by.id('explore-counter')).tap();
    await element(by.id('open-explore-detail')).tap();
    await expect(element(by.id('explore-detail-title'))).toHaveText('Explore detail');
    await goBack();
    await expect(element(by.id('explore-counter-value'))).toHaveText('3');
    await element(by.id('tab-home')).tap();
    await element(by.id('tab-explore')).tap();
    await expect(element(by.id('explore-counter-value'))).toHaveText('3');
  });
});
