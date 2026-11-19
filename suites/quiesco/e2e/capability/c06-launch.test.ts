// C6 启动阶段：冷启动后不加 sleep 直接操作
import { reset, test } from '../support';

test.beforeEach(reset);

test('C6 启动阶段：冷启动后不加 sleep 直接操作', async ({ app }) => {
  // beforeEach 中 relaunch({ clearData: true }) 刚冷启动完
  await app.type('login-email', 'user@example.com');
  await app.expectValue('login-email', 'user@example.com');
});
