// S15 Reanimated 动画
import { login, test } from '../support';

test('S15 Reanimated 动画', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-reanimated');
  await app.tap('rea-card');
  await app.tap('rea-card-action');
  await app.expectText('rea-result', 'Action done');
});
