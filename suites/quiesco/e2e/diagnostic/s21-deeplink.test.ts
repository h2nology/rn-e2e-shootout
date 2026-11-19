// S21 深链接
import { login, test } from '../support';

test('S21 深链接', async ({ app }) => {
  await login(app);
  await app.expectVisible('item-list');
  // 热启动：切到后台后打开深链接（openUrl 在后台时从 app 外部打开：iOS simctl openurl、Android VIEW intent）
  await app.device.sendToBackground();
  await app.openUrl('rnshootout://item/123');
  await app.expectText('item-detail-title', 'Item 123');
  // 冷启动：终止进程后以深链接启动（relaunch({ url }) 是真正的冷启动，数据保留）
  await app.device.terminate();
  await app.device.relaunch({ url: 'rnshootout://item/77' });
  await app.expectText('item-detail-title', 'Item 077');
});
