// C7 远程图片
import { login, test } from '../support';

test('C7 远程图片', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-image');
  await app.expectText('image-status', 'Loaded');
});
