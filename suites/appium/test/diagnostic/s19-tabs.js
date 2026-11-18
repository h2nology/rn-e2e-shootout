// S19 Tab 与嵌套导航（返回：Android driver.back()，iOS 点导航栏返回按钮）
import { resetApp, login, byId, tap, goBack } from '../support.js';

describe('S19', () => {
  beforeEach(resetApp);
  it('嵌套页返回后 Tab 状态保持', async () => {
    await login();
    await tap('tab-explore');
    for (let i = 0; i < 3; i++) await tap('explore-counter');
    await tap('open-explore-detail');
    await expect(byId('explore-detail-title')).toHaveText('Explore detail');
    await goBack();
    await expect(byId('explore-counter-value')).toHaveText('3');
    await tap('tab-home');
    await tap('tab-explore');
    await expect(byId('explore-counter-value')).toHaveText('3');
  });
});
