// S3 防抖搜索
import { login, test } from '../support';

test('S3 防抖搜索', async ({ app }) => {
  await login(app);
  // 逐字输入（perCharacter：每个字符一个按键，默认间隔 80 ms，之后等 app 空闲）
  await app.type('search-input', 'Item 04', { perCharacter: true });
  await app.expectText('search-count', '10 results');
  await app.expectExists('item-row-40');
  await app.expectExists('item-row-49');
  await app.expectNotExists('item-row-1');
});
