// S15 Reanimated 动画
import { resetApp, login, byId, tap } from '../support.js';

describe('S15', () => {
  beforeEach(resetApp);
  it('卡片展开后点击卡片内按钮', async () => {
    await login();
    await tap('tab-explore');
    await tap('open-reanimated');
    await tap('rea-card');
    await tap('rea-card-action');
    await expect(byId('rea-result')).toHaveText('Action done');
  });
});
