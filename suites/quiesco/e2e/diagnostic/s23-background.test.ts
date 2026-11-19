// S23 前后台切换与持久化
import { login, test } from '../support';

test('S23 前后台切换与持久化', async ({ app }) => {
  await login(app);
  await app.tap('add-item-button');
  await app.type('new-item-title', 'Draft text');
  await app.device.sendToBackground();
  // 场景本身要求在后台停留 2 秒（不是为了稳定而加的等待）
  await new Promise((r) => setTimeout(r, 2000));
  await app.device.bringToForeground();
  await app.expectValue('new-item-title', 'Draft text');
  await app.replaceText('new-item-title', 'Persisted');
  await app.tap('new-item-save');
  await app.device.terminate();
  await app.device.relaunch();
  await app.expectText('list-top-title', 'Top: Persisted');
});
