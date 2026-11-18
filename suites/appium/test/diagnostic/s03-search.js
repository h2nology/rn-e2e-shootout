// S3 防抖搜索（逐字输入，不粘贴）。
// iOS：XCUITest 的 setValue 本身就是逐个按键。
// Android：UiAutomator2 的 setValue 一次写入整段文字（setText），不满足“逐字输入”→ 聚焦后用 W3C 按键动作逐个按键。
import { resetApp, login, byId, isIOS } from '../support.js';

describe('S3', () => {
  beforeEach(resetApp);
  it('搜索关键字后只显示匹配项', async () => {
    await login();
    if (isIOS()) {
      await byId('search-input').setValue('Item 04');
    } else {
      await byId('search-input').click();
      await driver.keys('Item 04'.split(''));
      // UiAutomator2 只能看到屏幕上可见的视图；软键盘盖住列表下半部分时 #item-row-49 不在无障碍树中
      await driver.hideKeyboard();
    }
    await expect(byId('search-count')).toHaveText('10 results');
    await expect(byId('item-row-40')).toExist();
    await expect(byId('item-row-49')).toExist();
    await expect(byId('item-row-1')).not.toExist();
  });
});
