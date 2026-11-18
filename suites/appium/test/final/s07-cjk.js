// S7 中文 / 日文输入。S7a：文本 API（iOS 为 XCUITest typeText，Android 为 UiAutomator2 setText）。
// S7b（经由输入法）单独检查，见 RESULTS.md。
import { resetApp, login, byId, tap, typeText } from '../support.js';

describe('S7', () => {
  beforeEach(resetApp);
  it('S7a 输入中文和日文标题并保存', async () => {
    await login();
    await tap('add-item-button');
    await typeText(byId('new-item-title'), '测试标题 テスト');
    await tap('new-item-save');
    await tap('item-row-501');
    await expect(byId('item-detail-title')).toHaveText('测试标题 テスト');
  });
});
