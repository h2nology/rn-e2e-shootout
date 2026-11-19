// S7b 经由输入法输入中日文（iOS）。外部命令登记拼音和日文罗马字键盘；按键、选词经 system.tap（软键盘不在 app 的元素树中）。
// Android：AOSP 镜像只有 LatinIME，没有中日文输入法 → ✗（与工具无关）
import { execFileSync } from 'node:child_process';
import { login, reset, test } from '../support';

const setKeyboards = (...kbs: string[]) =>
  execFileSync('xcrun', ['simctl', 'spawn', 'booted', 'defaults', 'write', '-g', 'AppleKeyboards', '-array', ...kbs]);

test.beforeEach(reset);

test('S7b 拼音选词 + 日文转换', { tags: ['@ios'] }, async ({ app }) => {
  setKeyboards('zh_Hans-Pinyin@sw=Pinyin10-QWERTY;hw=Automatic', 'ja_JP-Romaji@sw=QWERTY-Japanese;hw=Automatic');
  try {
    await app.device.relaunch(); // 键盘设置在 app 下次显示键盘时生效
    await login(app);
    await app.tap('add-item-button');
    await app.tap('new-item-title');
    const key = (k: string) => app.device.system.tap({ text: k });
    // 先切到拼音键盘（其删除键 label 为 “删除”）
    for (let i = 0; i < 3; i++) {
      try {
        await app.device.system.expectVisible({ text: '删除' }, { timeoutMs: 1500 });
        break;
      } catch {
        await key('Next keyboard');
      }
    }
    for (const c of 'ceshi') await key(c);
    await app.device.system.tap({ text: /^测试,/ });
    for (const c of 'biaoti') await key(c);
    await app.device.system.tap({ text: /^标题,/ });
    await key('space');
    await key('Next keyboard');
    for (const c of 'tesuto') await key(c);
    await app.device.system.tap({ text: /^テスト,/ });
    await app.tap('new-item-save');
    await app.tap('item-row-501');
    await app.expectText('item-detail-title', '测试标题 テスト');
  } finally {
    setKeyboards('en_US@sw=QWERTY;hw=Automatic');
  }
});
