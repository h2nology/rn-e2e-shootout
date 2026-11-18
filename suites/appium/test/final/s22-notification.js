// S22 本地通知：必须从系统通知中心点击。
// 前置“通知权限已预先授权”：iOS 带 appium:permissions 重开会话；Android mobile: changePermissions。
// 打开通知中心：iOS 从屏幕左上角向下滑（XCUITest 在 app 进入后台后自动以 SpringBoard 为操作对象）；Android browser.openNotifications()。
import { resetApp, login, byId, tap, isIOS, sendToBackground, BUNDLE } from '../support.js';

async function grantNotifications() {
  if (isIOS()) {
    // 会话中途调用 mobile: setPermission（applesimutils）会使 WebDriverAgent 断开（实测）；simctl privacy 不支持通知权限。
    // 改为带 appium:permissions 重开会话：在 WDA 启动之前设置权限。
    await driver.reloadSession({
      ...driver.requestedCapabilities,
      'appium:permissions': JSON.stringify({ [BUNDLE]: { notifications: 'YES' } }),
    });
    await resetApp();
  } else {
    await driver.execute('mobile: changePermissions', {
      permissions: ['android.permission.POST_NOTIFICATIONS'],
      appPackage: BUNDLE,
      action: 'grant',
    });
  }
}

async function openNotificationCenter() {
  if (isIOS()) {
    const { width, height } = await driver.getWindowSize();
    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move({ x: Math.round(width * 0.2), y: 2 })
      .down()
      .move({ x: Math.round(width * 0.2), y: Math.round(height * 0.6), duration: 500 })
      .up()
      .perform();
  } else {
    await driver.openNotifications();
  }
}

describe('S22', () => {
  beforeEach(resetApp);
  it('从通知中心点击通知', async () => {
    await grantNotifications();
    await login();
    await tap('tab-settings');
    await tap('notify-in-3s');
    await sendToBackground();
    await openNotificationCenter();
    const titles = () =>
      isIOS()
        ? $$('-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "Hello from rnshootout"')
        : $$('android=new UiSelector().text("Hello from rnshootout")');
    // [W3] 本地通知在 3 秒后送达，分支判断之前先等它出现在通知中心
    await titles()[0].waitForExist();
    if (isIOS()) {
      // iOS 通知中心把同一 app 的多条通知折叠为一组（ListCell 的 label 含 “Grouped”），第一次点击只展开。
      // 已送达的通知不随 app 数据清除，第二轮起必然折叠 → 先展开
      const group = $('-ios predicate string:name == "ListCell" AND label CONTAINS "Grouped" AND label CONTAINS "Hello from rnshootout"');
      if (await group.isExisting()) {
        await group.click();
        // [W3] 等展开动画结束
        await $('-ios predicate string:label CONTAINS "Show less"').waitForDisplayed(); // label 实为 “Confirm Show less”
      }
    }
    if (isIOS()) {
      // iOS 27 通知中心里对通知卡片的 click / tap() 都被识别成横向滑动（卡片右滑露出 “Open” 后弹回），app 不打开（实测）。
      // 改为模拟用户的另一种打开方式：右滑卡片，再点露出的 “Open” 按钮（仍是从通知中心打开）
      const cell = $$('-ios predicate string:name == "ListCell" AND label CONTAINS "Hello from rnshootout" AND NOT (label CONTAINS "Grouped")')[0];
      const { x, y: top } = await cell.getLocation();
      const { width, height } = await cell.getSize();
      const y = Math.round(top + height / 2);
      await driver
        .action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: x + 40, y })
        .down()
        .move({ x: Math.round(x + width * 0.6), y, duration: 400 })
        .up()
        .perform();
      await $('-ios predicate string:type == "XCUIElementTypeButton" AND label == "Open"').click();
    } else {
      await titles()[0].click();
    }
    await expect(byId('notification-target')).toHaveText('Opened from notification');
  });
});
