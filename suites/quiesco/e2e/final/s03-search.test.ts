// S3 防抖搜索
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('S3 防抖搜索', async ({ app }) => {
  await login(app);
  // 逐字输入：type() 在 iOS 上是 insertText、Android 上是 commitText，整段一次写入 → 每个字符调用一次
  for (const ch of 'Item 04') await app.type('search-input', ch);
  await app.expectText('search-count', '10 results');
  await app.expectExists('item-row-40');
  await app.expectExists('item-row-49');
  await app.expectNotExists('item-row-1');
});
