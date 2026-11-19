// S11 永不静止的动画
import { login, test } from '../support';

test('S11 永不静止的动画', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-busy-animation');
  await app.tap('busy-tap');
  await app.expectText('busy-result', 'Tapped 1');
});
