// C5 嵌套滚动：横向轮播滚动到第 6 张
import { login, reset, test } from '../support';

test.beforeEach(reset);

test('C5 嵌套滚动：横向轮播滚动到第 6 张', async ({ app }) => {
  await login(app);
  await app.tap('tab-explore');
  await app.tap('open-nested');
  await app.scrollTo('nested-list', 'carousel');
  // 横向轮播上 scrollTo 误判“已到两端”（Scrolled … to both ends，实测）→ 手写真实滑动，直到第 6 张完全可见
  //      每次滑动实际移动约 445 pt（distance 指定一张卡片宽度也一样，实测），第 6 张不一定完全露出
  //      → 中心露出（visibleRatio ≥ 0.5，tap 瞄准整张卡片的中心）就停
  const [first] = await app.query('carousel-slide-1');
  for (let i = 0; i < 12; i++) {
    const [slide] = await app.query('carousel-slide-6');
    if (slide?.visible && slide.visibleRatio >= 0.5) break;
    await app.scroll('carousel', 'right', { distance: first.rect!.width });
  }
  await app.tap('carousel-slide-6');
  await app.expectText('carousel-result', 'Slide 6');
});
