// S22 本地通知。必须从系统通知中心点击（不允许用深链接或 sendUserNotification 代替）。
// Detox 无法操作系统通知中心 → 记为 ✗（见 RESULTS.md）。
describe('S22', () => {
  it.skip('从通知中心点击通知（Detox 不支持操作通知中心）', () => {});
});
