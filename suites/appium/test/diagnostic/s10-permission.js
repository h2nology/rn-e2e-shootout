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
    await (isIOS()
      ? byText('Allow While Using App')
      : $('id=com.android.permissioncontroller:id/permission_allow_foreground_only_button')
    ).click();
    await expect(byId('permission-status')).toHaveText('Granted');
  });
});
