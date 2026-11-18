// S8 原生控件（开关、滑块、日期选择器）
import { resetApp, login, byId, byText, tap, isIOS } from '../support.js';

/** 从滑钮（值 0 时位于左端）按住拖到轨道的 75% 处（W3C pointer actions） */
async function dragSlider(el, fraction) {
  const { x, y } = await el.getLocation();
  const { width, height } = await el.getSize();
  const cy = Math.round(y + height / 2);
  const startX = Math.round(x + height / 2); // 滑钮直径约等于控件高度
  const endX = Math.round(x + width * fraction);
  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: startX, y: cy })
    .down()
    .move({ x: endX, y: cy, duration: 500 })
    .up()
    .perform();
}

async function pickDate() {
  await tap('control-date');
  if (isIOS()) {
    // inline 日历中的日期按钮，label 形如 “Friday, December 25”
    await $('-ios predicate string:label CONTAINS "December 25"').click();
    await tap('control-date-done');
  } else {
    // 系统日期对话框：日期格子是虚拟无障碍节点，UiAutomator 可以按文字找到
    await byText('25').click();
    await byText('OK').click();
  }
}

describe('S8', () => {
  beforeEach(resetApp);
  it('调整开关、滑块、日期后提交', async () => {
    await login();
    await tap('tab-settings');
    await tap('open-controls');
    await tap('control-switch');
    await dragSlider(await byId('control-slider'), 0.75);
    await pickDate();
    await tap('control-submit');
    await expect(byId('control-result')).toHaveText('switch=on slider=75 date=2026-12-25');
  });
});
