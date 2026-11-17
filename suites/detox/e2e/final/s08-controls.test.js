// S8 原生控件（开关、滑块、日期选择器）
const { resetApp, login } = require('../support');

async function setSlider75() {
  // 两个平台都从滑钮位置向右滑动。
  // iOS：adjustSliderToPosition 在 Fabric 下不触发 onValueChange（实测）。
  // Android：按 getAttributes() 的宽度计算点击坐标会超出视图（单位不一致，实测）。
  await element(by.id('control-slider')).swipe('right', 'slow', 0.7, 0.03, 0.5);
}

async function pickDate() {
  await element(by.id('control-date')).tap();
  if (device.getPlatform() === 'ios') {
    await element(by.id('control-date-picker')).setDatePickerDate('2026-12-25', 'yyyy-MM-dd');
    await element(by.id('control-date-done')).tap();
  } else {
    // Android 系统日期对话框的日期格子画在同一个画布上（不是独立 View），Espresso 无法按文字匹配，
    // Detox 也没有 Android 的日期选择 API（setDatePickerDate 仅 iOS）。只能按坐标点击“25”：
    // 以 Detox 能识别的 OK 按钮为基准计算相对坐标（Medium_Phone_API_36_AOSP，“25”位于 (720, 1387) px，density 2.625）。
    // device.tap 的坐标换算实测不可靠，故不用。坐标依赖设备与月份布局，较脆弱。
    const DENSITY = 2.625;
    const ok = await element(by.text('OK')).getAttributes();
    await element(by.text('OK')).tap({ x: (720 - ok.frame.x) / DENSITY, y: (1387 - ok.frame.y) / DENSITY });
    await element(by.text('OK')).tap();
  }
}

describe('S8', () => {
  beforeEach(resetApp);
  it('调整开关、滑块、日期后提交', async () => {
    await login();
    await element(by.id('tab-settings')).tap();
    await element(by.id('open-controls')).tap();
    await element(by.id('control-switch')).tap();
    await setSlider75();
    await pickDate();
    await element(by.id('control-submit')).tap();
    await expect(element(by.id('control-result'))).toHaveText('switch=on slider=75 date=2026-12-25');
  });
});
