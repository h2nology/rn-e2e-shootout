// S8 原生控件
import { login, reset, tapAndroidDialogText, test } from '../support';

test.beforeEach(reset);

test('S8 原生控件', async ({ app }) => {
  await login(app);
  await app.tap('tab-settings');
  await app.tap('open-controls');
  await app.tap('control-switch');
  // 真实拖动滑钮（setValue 直接设值，场景禁止）
  await app.adjustSlider('control-slider', 0.75);
  await app.tap('control-date');
  if (app.platform === 'ios') {
    // inline 日历（原生 UIDatePicker）在 app 内部，日期格子不在 Quiesco 的元素树中，system.tap 也只看 app 之外的系统 UI
    // → 按 control-date-picker 内的相对位置点 25 日（en_US：周日开头，2026-12 的 25 日在第 4 行、第 6 列）
    const rect = (await app.attributes('control-date-picker')).rect!;
    await app.tap('control-date-picker', { point: { x: rect.width * (5.5 / 7), y: rect.height * 0.758 } });
    await app.tap('control-date-done');
  } else {
    // 系统日期对话框：Quiesco 的触摸到不了（见 support.ts）→ 外部命令点击
    tapAndroidDialogText('25');
    tapAndroidDialogText('OK');
  }
  await app.tap('control-submit');
  await app.expectText('control-result', 'switch=on slider=75 date=2026-12-25');
});
