// C7 远程图片
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('C7 远程图片', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-image');
  await app.expectText('image-status', 'Loaded');
});
