// S18 错误态与重试
import { login, postJson, test } from '../support';

test('S18 错误态与重试', async ({ app }) => {
  await login(app);
  // [W3] 等首次加载完成：登录后 app 依次 await 登录请求 → AsyncStorage.setItem（原生模块）→ 跳转首页 → GET /items。
  //      Quiesco 不跟踪原生模块的 Promise，setItem 期间所有 tracker 都空闲，登录的 tap 可能在首页首次请求之前就返回；
  //      之后注入的错误被首次请求消耗，Reload 拿到正常结果（Android 正式版 5 轮中 1 次）。Appium 同一位置有相同的等待
  await app.expectVisible('item-row-1');
  await postJson('/test/fail', { route: '/items', status: 500, count: 1 });
  await app.tap('list-reload');
  await app.expectVisible('error-view');
  await app.expectVisible({ text: 'Something went wrong' });
  await app.tap('error-retry');
  await app.expectVisible('item-row-1');
});
