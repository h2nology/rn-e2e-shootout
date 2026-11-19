// S7a 中文 / 日文输入
import { login, test } from '../support';

test('S7a 中文 / 日文输入', async ({ app }) => {
  await login(app);
  await app.tap('add-item-button');
  await app.type('new-item-title', '测试标题 テスト');
  await app.tap('new-item-save');
  await app.tap('item-row-501');
  await app.expectText('item-detail-title', '测试标题 テスト');
});
