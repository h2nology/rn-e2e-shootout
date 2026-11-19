// S16 轮询与 WebSocket
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S16 轮询与 WebSocket', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-live');
  await app.type('live-name', 'Alice');
  await app.tap('live-submit');
  await app.expectText('live-greeting', 'Hello, Alice');
});
