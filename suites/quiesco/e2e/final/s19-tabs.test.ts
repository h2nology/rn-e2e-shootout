// S19 Tab 与嵌套导航
import { login, test } from '../support';

test('S19 Tab 与嵌套导航', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  for (let i = 0; i < 3; i++) await app.tap('explore-counter');
  await app.tap('open-explore-detail');
  await app.expectText('explore-detail-title', 'Explore detail');
  // “返回”：Android 返回键；iOS 导航栏的返回按钮
  await app.goBack();
  await app.expectText('explore-counter-value', '3');
  await app.tap('tab-home');
  await app.tap('tab-explore');
  await app.expectText('explore-counter-value', '3');
});
