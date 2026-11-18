// S18 错误态与重试
import { resetApp, login, byId, byText, tap, postJson, isIOS } from '../support.js';

describe('S18', () => {
  beforeEach(resetApp);
  it('500 后显示错误页，重试后恢复', async () => {
    await login();
    await postJson('/test/fail', { route: '/items', status: 500, count: 1 });
    await tap('list-reload');
    await expect(byId('error-view')).toBeDisplayed();
    // iOS：无障碍树中同一段文字有两个嵌套的 StaticText（坐标相同），严格选择器模式下要明确取第一个
    await expect(
      isIOS()
        ? $$('-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "Something went wrong"')[0]
        : byText('Something went wrong'),
    ).toBeDisplayed();
    await tap('error-retry');
    await expect(byId('item-row-1')).toBeDisplayed();
  });
});
