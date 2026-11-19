// C5 嵌套滚动：横向轮播滚动到第 6 张
import { login, test } from '../support';

test('C5 嵌套滚动：横向轮播滚动到第 6 张', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-nested');
  await app.scrollTo('nested-list', 'carousel');
  await app.scrollTo('carousel', 'carousel-slide-6'); // 横向列表：向右，再向左
  await app.tap('carousel-slide-6');
  await app.expectText('carousel-result', 'Slide 6');
});
