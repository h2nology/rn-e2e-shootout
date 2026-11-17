// S10 定位权限。S10a：launchApp permissions 预先授权（iOS，applesimutils）。
// S10b：iOS 用 Detox 的 system API 点击系统弹窗；Android 无系统 UI 操作能力 → ✗。
const { resetApp, login, isIOS } = require('../support');

async function openPermission() {
  await login();
  await element(by.id('tab-settings')).tap();
  await element(by.id('open-permission')).tap();
  await element(by.id('request-location')).tap();
}

describe('S10', () => {
  it('S10a 预先授权后显示 Granted', async () => {
    await resetApp({ permissions: { location: 'inuse' } });
    await openPermission();
    await expect(element(by.id('permission-status'))).toHaveText('Granted');
  });

  // Android：Detox 无法操作系统权限弹窗 → ✗
  (isIOS ? it : it.skip)('S10b 点击系统弹窗“允许”', async () => {
    await resetApp();
    await openPermission();
    await system.element(by.system.label('Allow While Using App')).tap();
    await expect(element(by.id('permission-status'))).toHaveText('Granted');
  });
});
