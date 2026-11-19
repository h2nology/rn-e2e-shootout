// S21 深链接
import { login, openUrlFromOutside, reset, test } from '../support';

test.beforeEach(reset);

test('S21 深链接', async ({ app }) => {
  await login(app);
  await app.expectVisible('item-list');
  // 热启动：切到后台后打开深链接（外部命令，见 support.ts）
  await app.device.sendToBackground();
  await openUrlFromOutside(app, 'rnshootout://item/123');
  await app.expectText('item-detail-title', 'Item 123');
  // 冷启动：终止进程后以深链接启动（relaunch({ url }) 是真正的冷启动，数据保留）
  await app.device.terminate();
  await app.device.relaunch({ url: 'rnshootout://item/77' });
  await app.expectText('item-detail-title', 'Item 077');
});
