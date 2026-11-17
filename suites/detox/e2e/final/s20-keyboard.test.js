// S20 键盘遮挡。收起键盘：tapReturnKey（按回车）。
const { resetApp, login } = require('../support');

describe('S20', () => {
  beforeEach(resetApp);
  it('填写被键盘遮挡的输入框后提交', async () => {
    await login();
    await element(by.id('tab-settings')).tap();
    await element(by.id('open-long-form')).tap();
    await element(by.id('form-notes')).typeText('note');
    await element(by.id('form-notes')).tapReturnKey();
    await element(by.id('form-submit')).tap();
    await expect(element(by.id('form-result'))).toHaveText('Submitted: note');
  });
});
