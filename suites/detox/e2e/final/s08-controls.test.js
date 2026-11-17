// S8 原生控件（开关、滑块、日期选择器）
const { resetApp, login } = require('../support');

async function setSlider75() {
  if (device.getPlatform() === 'ios') {
    // adjustSliderToPosition 只改原生 UISlider 的值，Fabric 下的 RN Slider 收不到 onValueChange（实测），
    // 因此改为从滑钮位置向右滑动。
    await element(by.id('control-slider')).swipe('right', 'slow', 0.7, 0.03, 0.5);
  } else {
    // Android SeekBar：点击轨道上 75% 的位置
    const { frame } = await element(by.id('control-slider')).getAttributes();
    await element(by.id('control-slider')).tap({ x: frame.width * 0.75, y: frame.height / 2 });
  }
}

async function pickDate() {
  await element(by.id('control-date')).tap();
  if (device.getPlatform() === 'ios') {
    await element(by.id('control-date-picker')).setDatePickerDate('2026-12-25', 'yyyy-MM-dd');
    await element(by.id('control-date-done')).tap();
  } else {
    await element(by.text('25')).tap();
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
