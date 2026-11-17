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
    if (device.getPlatform() === 'android') {
      // [W1] 键盘收起后 KeyboardAvoidingView 仍在调整布局，Detox（Android）不等待，点击会落空（实测）。
      //      没有可等待的元素状态，只能固定等待。
      await new Promise((r) => setTimeout(r, 1000));
    }
    await element(by.id('form-submit')).tap();
    await expect(element(by.id('form-result'))).toHaveText('Submitted: note');
  });
});
