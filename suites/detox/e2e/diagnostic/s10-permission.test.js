// S10 定位权限。S10a：iOS 用 launchApp permissions 预先授权（applesimutils）；
//   Android 上 launchApp 的 permissions 参数无效，用外部命令 pm grant（重置用 pm clear 撤销了权限）。
// S10b：iOS 用 Detox 的 system API 点击系统弹窗；Android 无系统 UI 操作能力 → ✗。
const { execSync } = require('child_process');
const { resetApp, login } = require('../support');

async function openPermission() {
  await login();
  await element(by.id('tab-settings')).tap();
  await element(by.id('open-permission')).tap();
  await element(by.id('request-location')).tap();
}

describe('S10', () => {
  it('S10a 预先授权后显示 Granted', async () => {
    await resetApp({ permissions: { location: 'inuse' } });
    if (device.getPlatform() === 'android') {
      for (const p of ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION']) {
        execSync(`adb -s ${device.id} shell pm grant com.rnshootout.app android.permission.${p}`);
      }
    }
    await openPermission();
    await expect(element(by.id('permission-status'))).toHaveText('Granted');
  });

  // Android：Detox 无法操作系统权限弹窗 → ✗
  (device.getPlatform() === 'ios' ? it : it.skip)('S10b 点击系统弹窗“允许”', async () => {
    await resetApp();
    await openPermission();
    await system.element(by.system.label('Allow While Using App')).tap();
    await expect(element(by.id('permission-status'))).toHaveText('Granted');
  });
});
