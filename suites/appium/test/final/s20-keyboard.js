// S20 键盘遮挡。收起键盘：iOS 输入回车（iPhone 键盘没有收起按钮，hideKeyboard 不可靠）；Android driver.hideKeyboard()。
import { resetApp, login, byId, tap, isIOS, typeText } from '../support.js';

describe('S20', () => {
  beforeEach(resetApp);
  it('填写被键盘遮挡的输入框后提交', async () => {
    await login();
    await tap('tab-settings');
    await tap('open-long-form');
    await typeText(byId('form-notes'), 'note');
    if (isIOS()) await byId('form-notes').addValue('\n');
    else await driver.hideKeyboard();
    await tap('form-submit');
    await expect(byId('form-result')).toHaveText('Submitted: note');
  });
});
