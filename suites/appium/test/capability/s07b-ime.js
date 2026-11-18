// S7b 经由输入法输入中日文（scenarios.md S7 的第二档）。只记 ✓ / ✗ / 需额外配置。
// iOS：模拟器默认只有英文键盘，需要登记拼音和日文罗马字键盘。
//   XCUITest 驱动的 mobile: configureLocalization 写入的设置值格式有误（`…;@hw=Automatic`），键盘不切换（实测）
//   → 用外部命令 simctl 写入 AppleKeyboards（需额外配置）。之后的按键、选词、切换键盘都用 Appium 的元素操作完成。
// Android：API 36 AOSP 镜像只有 LatinIME（不含中日文），没有可用的输入法 → ✗（与工具无关，各工具相同）。
import { execSync } from 'node:child_process';
import { resetApp, login, byId, tap, isIOS } from '../support.js';

const setKeyboards = (...kbs) =>
  execSync(`xcrun simctl spawn booted defaults write -g AppleKeyboards -array ${kbs.map((k) => `"${k}"`).join(' ')}`);

describe('S7b 经由输入法', () => {
  it('拼音输入 ceshi biaoti 选词，切换日文键盘输入 tesuto 转换', async function () {
    if (!isIOS()) throw new Error('Android：AOSP 镜像没有中日文输入法');
    setKeyboards('zh_Hans-Pinyin@sw=Pinyin10-QWERTY;hw=Automatic', 'ja_JP-Romaji@sw=QWERTY-Japanese;hw=Automatic');
    try {
      await resetApp(); // 键盘设置在 app 下次显示键盘时生效
      await login();
      await tap('add-item-button');
      const title = byId('new-item-title');
      await title.click();
      const key = (k) => $(`-ios predicate string:type == "XCUIElementTypeKey" AND label == "${k}"`);
      const type = async (word) => {
        for (const ch of word) await key(ch).click();
      };
      // 候选栏的 Cell label 形如 “测试, 测试的测，考试的试”（“测试版, …” 不匹配）。候选栏异步出现，$().click() 隐式等待
      const pick = (w) => $(`-ios predicate string:type == "XCUIElementTypeCell" AND label BEGINSWITH "${w},"`).click();
      // 系统记住上次使用的键盘（上一轮最后用的是日文），先切到拼音键盘：其删除键 label 为 “删除”（日文为 “削除”）
      const next = $('-ios predicate string:type == "XCUIElementTypeButton" AND label == "Next keyboard"');
      await next.waitForDisplayed(); // [W3] 等键盘出现
      for (let i = 0; i < 3 && !(await key('删除').isExisting()); i++) await next.click();
      await expect(key('删除')).toBeDisplayed();
      await type('ceshi');
      await pick('测试');
      await type('biaoti');
      await pick('标题');
      await key('space').click();
      await next.click(); // 切到日文键盘
      await type('tesuto');
      await pick('テスト');
      await tap('new-item-save');
      await tap('item-row-501');
      await expect(byId('item-detail-title')).toHaveText('测试标题 テスト');
    } finally {
      setKeyboards('en_US@sw=QWERTY;hw=Automatic');
    }
  });
});
