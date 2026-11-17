// C1–C11 能力边界检查（scenarios.md 3.3）。只记 ✓ / ✗ / 需额外配置，不计入速度和 flake 率。
// 结果汇总见 ../../RESULTS.md。平台不支持的项用 it.skip 并在注释中写明原因。
const { execSync } = require('child_process');
const { resetApp, login } = require('../support');

const ios = () => device.getPlatform() === 'ios';
const sh = (cmd) => execSync(cmd, { stdio: 'pipe' }).toString();
const adb = (args) => sh(`adb -s ${device.id} ${args}`);

async function openSystemPage() {
  await login();
  await element(by.id('tab-settings')).tap();
  await element(by.id('open-system')).tap();
}

describe('C1 生物识别', () => {
  // Android：Detox 没有指纹 / 生物识别 API → ✗
  // iOS：Detox 自带的 device.unmatchFace() / matchFace() 在 Face ID 弹窗显示时卡在 waitForActive
  //   （app 处于 inactive，等 5 分钟超时，实测）。改用外部命令 notifyutil 发送同样的模拟器信号 → 需额外配置。
  const face = (ok) =>
    sh(`xcrun simctl spawn ${device.id} notifyutil -p com.apple.BiometricKit_Sim.pearl.${ok ? 'match' : 'nomatch'}`);
  (ios() ? it : it.skip)('iOS：失败一次（点取消）再成功', async () => {
    await resetApp();
    await device.setBiometricEnrollment(true);
    await login();
    await element(by.id('tab-settings')).tap();
    await element(by.id('open-biometric')).tap();
    await element(by.id('biometric-unlock')).tap();
    face(false);
    await system.element(by.system.label('Cancel')).tap();
    await expect(element(by.id('biometric-status'))).toHaveText('Failed');
    await element(by.id('biometric-unlock')).tap();
    face(true);
    await waitFor(element(by.id('biometric-status'))).toHaveText('Unlocked').withTimeout(10000);
  });
});

describe('C2 跨 app 登录', () => {
  // 登录页在 app 进程外（iOS：ASWebAuthenticationSession；Android：Chrome Custom Tabs），
  // Detox 只能操作 app 进程内的视图（iOS 的 system API 仅支持系统弹窗）。先尝试，失败即 ✗。
  // Android：按 METHODOLOGY v3，C2 在 Medium_Phone_API_36_GAPIS（有 Chrome）上执行。
  it('在外部浏览器页面输入并提交，回到 app', async () => {
    await resetApp();
    await openSystemPage();
    // [X] Android：Custom Tab 打开期间 Fabric 定时器一直不空闲，tap 等待 idle 超时（实测，同 C3）→ 关闭同步
    if (!ios()) await device.disableSynchronization();
    await element(by.id('oauth-login')).tap();
    if (ios()) await system.element(by.system.label('Continue')).tap();
    else await new Promise((r) => setTimeout(r, 3000)); // [W1] 关闭同步后等 Custom Tab 加载
    await web.element(by.web.id('username')).typeText('oauth-user');
    await web.element(by.web.id('submit')).tap();
    await expect(element(by.id('oauth-status'))).toHaveText('Signed in as oauth-user');
  });
});

describe('C3 系统分享面板', () => {
  it('打开后关闭，回到 app', async () => {
    await resetApp();
    await openSystemPage();
    if (ios()) {
      await element(by.id('share-button')).tap();
      await device.tap({ x: 200, y: 200 }); // 点击面板外区域关闭
      await expect(element(by.id('share-status'))).toHaveText('Share dismissed');
    } else {
      // [X] Android：分享面板打开期间 Fabric UI 一直不空闲，tap 等待 idle 超时（实测）→ 关闭同步
      await device.disableSynchronization();
      await element(by.id('share-button')).tap();
      await new Promise((r) => setTimeout(r, 2000)); // [W1] 关闭同步后等面板出现
      await device.pressBack();
      await waitFor(element(by.id('share-status'))).toHaveText('Share dismissed').withTimeout(10000);
    }
  });
});

describe('C4 选择器', () => {
  it('同 testID 的第 3 个元素；仅 accessibility label 的元素', async () => {
    await resetApp();
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-dup')).tap();
    await element(by.id('dup-row')).atIndex(2).tap();
    await expect(element(by.id('dup-result'))).toHaveText('Row 3');
    await element(by.label('Secret button')).tap();
    await expect(element(by.id('a11y-result'))).toHaveText('Found');
  });
});

describe('C5 嵌套滚动', () => {
  it('横向轮播滚动到第 6 张并点击', async () => {
    await resetApp();
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-nested')).tap();
    await waitFor(element(by.id('carousel-slide-6'))).toBeVisible().whileElement(by.id('carousel')).scroll(200, 'right');
    await element(by.id('carousel-slide-6')).tap();
    await expect(element(by.id('carousel-result'))).toHaveText('Slide 6');
  });
});

describe('C6 启动阶段', () => {
  it('冷启动后不加 sleep 直接操作登录页', async () => {
    await resetApp();
    await element(by.id('login-email')).typeText('user@example.com');
    await expect(element(by.id('login-email'))).toHaveText('user@example.com');
  });
});

describe('C7 远程图片', () => {
  it('断言延迟返回的图片已加载', async () => {
    await resetApp();
    await login();
    await element(by.id('tab-explore')).tap();
    await element(by.id('open-image')).tap();
    // Detox 的同步不等待 expo-image 的网络加载（不加 waitFor 时失败，实测）→ 需 waitFor
    await waitFor(element(by.id('image-status'))).toHaveText('Loaded').withTimeout(10000);
  });
});

describe('C8 深色模式', () => {
  // Detox 没有切换外观的 API，用外部命令（simctl / adb）
  it('切换系统外观后界面随之变化', async () => {
    await resetApp();
    await openSystemPage();
    await expect(element(by.id('theme-indicator'))).toHaveText('light');
    if (ios()) sh(`xcrun simctl ui ${device.id} appearance dark`);
    else adb('shell cmd uimode night yes');
    try {
      await waitFor(element(by.id('theme-indicator'))).toHaveText('dark').withTimeout(5000);
    } finally {
      if (ios()) sh(`xcrun simctl ui ${device.id} appearance light`);
      else adb('shell cmd uimode night no');
    }
  });
});

describe('C9 横竖屏', () => {
  // Detox 文档只写明 iPad 上的限制（需声明全屏），两个平台都实测
  it('旋转后布局变化', async () => {
    await resetApp();
    await openSystemPage();
    await device.setOrientation('landscape');
    await expect(element(by.id('orientation-indicator'))).toHaveText('landscape');
    await device.setOrientation('portrait');
    await expect(element(by.id('orientation-indicator'))).toHaveText('portrait');
  });
});

describe('C10 系统语言', () => {
  // iOS：launchApp({ languageAndLocale })。Android：Detox 无 API，用 per-app 语言（adb shell cmd locale）。
  it('日文 / 中文启动时登录按钮文字', async () => {
    for (const [lang, locale, text] of [['ja', 'ja-JP', 'ログイン'], ['zh-Hans', 'zh-CN', '登录']]) {
      if (ios()) {
        await resetApp({ languageAndLocale: { language: lang, locale } });
      } else {
        await resetApp();
        adb(`shell cmd locale set-app-locales com.rnshootout.app --locales ${locale}`);
        await device.launchApp({ newInstance: true });
      }
      // 按钮是 Pressable（View），不是文字元素：iOS 上文字只暴露为 accessibility label → toHaveLabel；
      // Android 上 toHaveText 要求 TextView → 匹配按钮内的文字元素
      if (ios()) await expect(element(by.id('login-submit'))).toHaveLabel(text);
      else await expect(element(by.text(text).withAncestor(by.id('login-submit')))).toBeVisible();
    }
    if (!ios()) adb('shell cmd locale set-app-locales com.rnshootout.app --locales en-US');
  });
});

describe('C11 远程推送', () => {
  // scenarios.md 的步骤是“发推送 → 点击通知”。iOS：push-ios.sh 发出的横幅能显示，但 Detox 的 system API
  //   只覆盖系统弹窗，找不到横幅（每次查找约 20 秒，横幅早已消失；预热 XCUITest runner、试多种 label 均失败，实测）。
  // 因此改试 Detox 官方的推送测试方式 sendUserNotification（模拟“用户点击了该通知”，不经过系统通知中心）。
  //   即使通过也只算“需额外说明”。两个平台都实测：
  //   iOS：app 不进入目标页（与 S21 冷启动深链接同样不生效）→ ✗。
  //   Android：后台调用报 “No Activity found to handle Intent”；launchApp({ newInstance: true, userNotification })
  //   能启动但不进入目标页——Detox 把通知数据放在启动 intent 的 extras 中，需要 app 侧代码读取，
  //   本 app 使用 expo-notifications，不允许为单个工具改 app → ✗。
  it('sendUserNotification 打开目标页', async () => {
    await resetApp();
    await login();
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'Push from rnshootout',
      body: 'Tap to open',
      payload: { target: 'push' },
    });
    await expect(element(by.id('notification-target'))).toHaveText('Opened from push');
  });
});
