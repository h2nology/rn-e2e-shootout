// S10 定位权限。
// S10a：预先授权。iOS：mobile: simctl privacy grant；Android：mobile: changePermissions（重置用 pm clear 撤销了权限）。
// S10b：系统弹窗真实出现，由测试点击“允许”（XCUITest / UiAutomator2 都能操作系统弹窗）。
import { resetApp, login, byId, byText, tap, isIOS, BUNDLE } from '../support.js';

async function openPermission() {
  await login();
  await tap('tab-settings');
  await tap('open-permission');
  await tap('request-location');
}

describe('S10', () => {
  beforeEach(resetApp);
  it('S10a 预先授权后显示 Granted', async () => {
    if (isIOS()) {
      await driver.execute('mobile: simctl', { command: 'privacy', args: ['grant', 'location', BUNDLE] });
    } else {
      await driver.execute('mobile: changePermissions', {
        permissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
        appPackage: BUNDLE,
        action: 'grant',
      });
    }
    await openPermission();
    await expect(byId('permission-status')).toHaveText('Granted');
  });
  it('S10b 点击系统弹窗“允许”', async () => {
    await openPermission();
    // Android（API 36 AOSP）按钮文字显示为全大写，按系统对话框的 resource-id 定位
    if (isIOS()) {
      // [W2] 系统弹窗刚出现时的点击会被 iOS 忽略（click 返回成功但弹窗不消失；模拟器重启后实测约 1/2–1/3 发生），
      //      弹窗残留会挡住后续所有场景。按钮一进入无障碍树 displayed / hittable 即为 true，没有可等待的状态，
      //      waitForDisplayed、mobile: alert accept 都无效（实测）→ 点击后弹窗仍在则再点。
      const allow = byText('Allow While Using App');
      await driver.waitUntil(
        async () => {
          if (await allow.isExisting()) await allow.click();
          return !(await allow.isExisting());
        },
        { timeout: 15000, interval: 1000 },
      );
    } else {
      await $('id=com.android.permissioncontroller:id/permission_allow_foreground_only_button').click();
    }
    await expect(byId('permission-status')).toHaveText('Granted');
  });
});
