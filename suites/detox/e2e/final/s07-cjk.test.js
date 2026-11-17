// S7 中文 / 日文输入。S7a：用文本 API 写入（Detox replaceText 直接设置文字，不经过输入法）。
// S7b（经由输入法）：Detox 没有操作系统输入法的 API → 记为 ✗，见 RESULTS.md。
const { resetApp, login } = require('../support');

describe('S7', () => {
  beforeEach(resetApp);
  it('S7a 输入中文和日文标题并保存', async () => {
    await login();
    await element(by.id('add-item-button')).tap();
    await element(by.id('new-item-title')).replaceText('测试标题 テスト');
    await element(by.id('new-item-save')).tap();
    await element(by.id('item-row-501')).tap();
    await expect(element(by.id('item-detail-title'))).toHaveText('测试标题 テスト');
  });
});
