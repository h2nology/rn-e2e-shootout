// S21 深链接。
// 热启动：外部命令 `xcrun simctl openurl` / `adb shell am start`（scenarios.md S21 允许，已记录）。
//   Detox 自带的 launchApp({ newInstance: false, url }) 在 RN 0.88（SceneDelegate）下不生效（实测）。
// 冷启动：只能用 Detox 自带的 launchApp({ newInstance: true, url })——外部命令启动的进程 Detox 无法连接。
//   该 API 在 RN 0.88 下同样不生效（实测）→ iOS 上 S21 记为 ✗（RN 0.88 不在 Detox 官方支持范围）。
const { execSync } = require('child_process');
const { resetApp, login } = require('../support');

function openUrlExternally(url) {
  if (device.getPlatform() === 'ios') {
    execSync(`xcrun simctl openurl ${device.id} ${url}`);
  } else {
    execSync(`adb -s ${device.id} shell am start -a android.intent.action.VIEW -d "${url}" com.rnshootout.app`);
  }
}

describe('S21', () => {
  beforeEach(resetApp);
  it('热启动与冷启动打开深链接', async () => {
    await login();
    await device.sendToHome();
    openUrlExternally('rnshootout://item/123');
    await expect(element(by.id('item-detail-title'))).toHaveText('Item 123');
    await device.terminateApp();
    await device.launchApp({ newInstance: true, url: 'rnshootout://item/77' });
    await expect(element(by.id('item-detail-title'))).toHaveText('Item 077');
  });
});
