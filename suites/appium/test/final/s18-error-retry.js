// S18 错误态与重试
import { resetApp, login, byId, byText, tap, postJson, isIOS } from '../support.js';

describe('S18', () => {
  beforeEach(resetApp);
  it('500 后显示错误页，重试后恢复', async () => {
    await login();
    // [W3] 等首次加载完成：Appium 不等待 app 的网络请求，首次 GET /items 尚未到达服务端时注入的错误会被它消耗，
    //      之后点 Reload 拿到的是正常结果（iOS 实测）
    await byId('item-row-1').waitForDisplayed();
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
