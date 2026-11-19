// S8 原生控件
import { login, test } from '../support';

test('S8 原生控件', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-controls');
  await app.tap('control-switch');
  // 真实拖动滑钮（setValue 直接设值，场景禁止）
  await app.adjustSlider('control-slider', 0.75);
  await app.tap('control-date');
  // 日期格子：iOS 是 inline 日历（UIKit 视图），Android 是系统日期对话框（app 的独立窗口），都经 system.* 以真实触摸点击
  await app.device.system.tap({ text: '25' });
  if (app.platform === 'ios') await app.tap('control-date-done');
  else await app.device.system.tap({ id: 'android:id/button1' }); // OK
  await app.tap('control-submit');
  await app.expectText('control-result', 'switch=on slider=75 date=2026-12-25');
});
