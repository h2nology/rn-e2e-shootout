// S11 永不静止的动画
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S11 永不静止的动画', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-busy-animation');
  await app.tap('busy-tap');
  await app.expectText('busy-result', 'Tapped 1');
});
