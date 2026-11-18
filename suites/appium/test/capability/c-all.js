// C1–C11 能力边界检查（scenarios.md 3）。只记 ✓ / ✗ / 需额外配置，不计入速度和 flake 率。
// 结果汇总见 ../../RESULTS.md。运行：PLATFORM=ios SPEC=./test/capability/c-all.js npx wdio run wdio.conf.js
import { execSync } from 'node:child_process';
import path from 'node:path';
import { resetApp, login, byId, byText, tap, isIOS, typeText, sendToBackground, sel } from '../support.js';

const PUSH_IOS = path.resolve(import.meta.dirname, '../../../../mock-server/scripts/push-ios.sh');

async function openSystemPage() {
  await login();
  await tap('tab-settings');
  await tap('open-system');
}

describe('C1 生物识别', () => {
  it('失败一次（iOS 点取消）再成功', async () => {
    await resetApp();
    if (isIOS()) await driver.execute('mobile: enrollBiometric', { isEnabled: true });
    await login();
    await tap('tab-settings');
    await tap('open-biometric');
    await tap('biometric-unlock');
    // [W3] iOS：Face ID 界面出现前发送的匹配信号会被忽略（实测：直接发送后界面停在扫描中）
    const faceId = () => byText('Face ID').waitForDisplayed();
    if (isIOS()) {
      await faceId();
      await driver.execute('mobile: sendBiometricMatch', { type: 'faceId', match: false });
      // 系统 LocalAuthentication 弹窗的 Cancel 在无障碍树中是两层同名按钮，取第一个
      // [W2] 弹窗刚出现时的点击被忽略（同 S10b、C3；单次 click 或单次 tap() 都失败，实测）→ 点完弹窗仍在则再点
      const cancel = () => $$('-ios predicate string:type == "XCUIElementTypeButton" AND label == "Cancel"');
      await cancel()[0].waitForDisplayed();
      await driver.waitUntil(
        async () => {
          if ((await cancel().length) > 0) await cancel()[0].click();
          return (await cancel().length) === 0;
        },
        { timeout: 15000, interval: 1000 },
      );
    } else {
      // 前提：模拟器已设置 PIN 并登记指纹 id 1（需额外配置：adb shell locksettings set-pin + 设置 app 内登记，见 RESULTS.md）。
      // 未登记的指纹 id 2 → 系统提示 “Not recognized”，弹窗不关闭（与 iOS 相同），点取消结束验证
      const indicator = $('id=com.android.systemui:id/indicator');
      await indicator.waitForDisplayed();
      await driver.fingerPrint(2);
      await expect(indicator).toHaveText(expect.stringContaining('Not recognized'));
      await $('id=com.android.systemui:id/button_negative').click();
    }
    await expect(byId('biometric-status')).toHaveText('Failed');
    await tap('biometric-unlock');
    if (isIOS()) {
      await faceId();
      await driver.execute('mobile: sendBiometricMatch', { type: 'faceId', match: true });
    } else await driver.fingerPrint(1);
    await expect(byId('biometric-status')).toHaveText('Unlocked');
  });
});

describe('C2 跨 app 登录', () => {
  it('在外部浏览器页面输入并提交，回到 app', async () => {
    await resetApp();
    await openSystemPage();
    await tap('oauth-login');
    if (isIOS()) {
      await byText('Continue').click(); // ASWebAuthenticationSession 的系统确认框
      await $('-ios class chain:**/XCUIElementTypeTextField').setValue('oauth-user');
      await $('-ios predicate string:type == "XCUIElementTypeButton" AND label == "Continue"').click();
    } else {
      await $('android=new UiSelector().className("android.widget.EditText")').setValue('oauth-user');
      await $('android=new UiSelector().className("android.widget.Button")').click();
    }
    await expect(byId('oauth-status')).toHaveText('Signed in as oauth-user');
  });
});

describe('C3 系统分享面板', () => {
  it('打开后关闭，回到 app', async () => {
    await resetApp();
    await openSystemPage();
    await tap('share-button');
    if (isIOS()) {
      // iOS 27 的分享面板没有关闭按钮，点面板外的空白区域关闭。
      // [W2] 面板出现后约 3 秒内的点击被忽略（立刻点 0/3，pause 3 s 后点 3/3，实测），没有可等待的状态 → 点完状态未变则再点
      await $$('-ios predicate string:label == "Copy"')[0].waitForDisplayed();
      const status = byId('share-status');
      await driver.waitUntil(
        async () => {
          await driver.execute('mobile: tap', { x: 200, y: 400 }); // 状态文字下方的空白区域（避开按钮）
          return (await status.getText()) === 'Share dismissed';
        },
        { timeout: 15000, interval: 1000 },
      );
    } else {
      await $$('android=new UiSelector().packageName("com.android.intentresolver")')[0].waitForExist(); // 面板出现后再按返回
      await driver.back();
    }
    await expect(byId('share-status')).toHaveText('Share dismissed');
  });
});

describe('C4 选择器', () => {
  it('同 testID 的第 3 个元素；仅 accessibility label 的元素', async () => {
    await resetApp();
    await login();
    await tap('tab-explore');
    await tap('open-dup');
    await $$(sel('dup-row'))[2].click();
    await expect(byId('dup-result')).toHaveText('Row 3');
    await $('~Secret button').click();
    await expect(byId('a11y-result')).toHaveText('Found');
  });
});

describe('C5 嵌套滚动', () => {
  it('横向轮播滚动到第 6 张并点击', async () => {
    await resetApp();
    await login();
    await tap('tab-explore');
    await tap('open-nested');
    const slide = byId('carousel-slide-6');
    await slide.scrollIntoView({ scrollableElement: await byId('carousel'), direction: 'left', maxScrolls: 10 });
    await slide.click();
    await expect(byId('carousel-result')).toHaveText('Slide 6');
  });
});

describe('C6 启动阶段', () => {
  it('冷启动后不加 sleep 直接操作登录页', async () => {
    await resetApp();
    await typeText(byId('login-email'), 'user@example.com');
    await expect(byId('login-email')).toHaveText('user@example.com');
  });
});

describe('C7 远程图片', () => {
  it('断言延迟返回的图片已加载', async () => {
    await resetApp();
    await login();
    await tap('tab-explore');
    await tap('open-image');
    await expect(byId('image-status')).toHaveText('Loaded');
  });
});

describe('C8 深色模式', () => {
  const set = (dark) =>
    isIOS()
      ? driver.execute('mobile: setAppearance', { style: dark ? 'dark' : 'light' })
      : driver.execute('mobile: setUiMode', { mode: 'night', value: dark ? 'yes' : 'no' });
  it('切换系统外观后界面随之变化', async () => {
    await resetApp();
    await openSystemPage();
    await expect(byId('theme-indicator')).toHaveText('light');
    await set(true);
    try {
      await expect(byId('theme-indicator')).toHaveText('dark');
    } finally {
      await set(false);
    }
  });
});

describe('C9 横竖屏', () => {
  it('旋转后布局变化', async () => {
    await resetApp();
    await openSystemPage();
    await driver.setOrientation('LANDSCAPE');
    try {
      await expect(byId('orientation-indicator')).toHaveText('landscape');
    } finally {
      await driver.setOrientation('PORTRAIT');
    }
    await expect(byId('orientation-indicator')).toHaveText('portrait');
  });
});

describe('C10 系统语言', () => {
  // iOS：language / locale capability 会重启 SpringBoard 等系统服务（驱动日志提示），之后 WebDriverAgent 断开（实测）
  //   → 改用 mobile: launchApp 的启动参数 -AppleLanguages / -AppleLocale，只改本 app 的语言。
  // Android：mobile: shell 需要 --allow-insecure，先试 language / locale capability（reloadSession）。
  it('日文 / 中文启动时登录按钮文字', async () => {
    const base = { ...driver.requestedCapabilities };
    try {
      for (const [language, locale, text] of [['ja', 'JP', 'ログイン'], ['zh-Hans', 'CN', '登录']]) {
        if (isIOS()) {
          await resetApp();
          await driver.execute('mobile: terminateApp', { bundleId: 'com.rnshootout.app' });
          await driver.execute('mobile: launchApp', {
            bundleId: 'com.rnshootout.app',
            arguments: ['-AppleLanguages', `(${language})`, '-AppleLocale', `${language.split('-')[0]}_${locale}`],
          });
        } else {
          await driver.reloadSession({ ...base, 'appium:language': language.split('-')[0], 'appium:locale': locale });
          await resetApp();
        }
        const label = isIOS()
          ? $(`-ios predicate string:name == "login-submit" AND label == "${text}"`)
          : $(`android=new UiSelector().resourceId("login-submit").childSelector(new UiSelector().text("${text}"))`);
        await expect(label).toBeDisplayed();
      }
    } finally {
      if (!isIOS()) await driver.reloadSession({ ...base, 'appium:language': 'en', 'appium:locale': 'US' });
    }
  });
});

describe('C11 远程推送', () => {
  it('发送推送后点击通知打开目标页', async () => {
    if (!isIOS()) {
      // Android：模拟器上没有可用的 FCM 投递方式（各工具共通）→ ✗
      throw new Error('Android：无法从外部向 app 投递远程推送');
    }
    await resetApp();
    await login();
    await sendToBackground();
    execSync(`sh ${PUSH_IOS} booted`);
    const banner = $$('-ios predicate string:label CONTAINS "Push from rnshootout"')[0];
    await banner.waitForExist({ timeout: 10000 });
    await banner.click();
    await expect(byId('notification-target')).toHaveText('Opened from push');
  });
});
