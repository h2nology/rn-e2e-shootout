# Appium：等待与同步绕过清单（正式版）

按 METHODOLOGY 4 分类。诊断版（`test/diagnostic`）不含以下任何一项。

WebdriverIO 的元素命令（`click`、`setValue` 等）和 `expect` 断言自带隐式等待（元素出现 / 断言成立前自动重试），属于工具默认行为，不计数。但 `$()` 本身不等待：元素尚不存在时取到的对象没有 elementId，传给 `scrollableElement` 等参数时报 “Malformed type for elementId”，这类情况需要显式等待。

| # | 文件:行 | 类别 | 平台 | 内容 | 为什么需要 |
|---|---|---|---|---|---|
| 1 | `test/support.js:68` | W3 | iOS | `typeText`：先输入第一个字符，`waitUntil` 输入框的值长度为 1，再 `addValue` 其余部分 | XCUITest 不等待 app：RN 受控 TextInput 对第一次按键的 setState 往返较慢，期间的后续按键被写回的旧值覆盖，丢 1–3 个字符（诊断版 iOS 因此 2/24）。驱动文档建议的 `maxTypingFrequency` 调到 20 冷启动下仍 4/8 失败；本写法冷启动 24/24 |
| 2 | `test/final/s06-long-list.js:6` | W3 | 两平台 | 单测超时 60 s → 300 s | 滑动到第 400 行需要数十次滑动，iOS 约 179 s（诊断版两平台都在 60 s 超时） |
| 3 | `test/final/s06-long-list.js:12` | W3 | iOS | `list.waitForDisplayed()` | `$()` 不等待，登录后列表尚未渲染时传给 `scrollIntoView` 报 Malformed elementId |
| 4 | `test/final/s09-webview.js:15` | W3 | iOS | `send.waitForDisplayed()` | 按钮进入无障碍树时网页尚不可交互，立刻 `tap()` 不生效（实测 0/2，等待后 3/3） |
| 5 | `test/final/s09-webview.js:19` | W2 | iOS | 点完后结果仍为 `Waiting` 则再点（`waitUntil` 内重复 `tap()`） | 加 #4 后仍偶发点击无效（单独 16 次失败 2 次；全套 4 次中失败 2 次）。失败截图中页面已完全显示、按钮坐标不变，原因未查明 |
| 6 | `test/final/s10-permission.js:36` | W2 | iOS | 点 “Allow While Using App” 后弹窗仍在则再点 | 系统弹窗刚出现时的点击被 iOS 忽略（`click` 返回成功但弹窗不消失；模拟器重启后约 1/2–1/3 发生）。按钮一进入无障碍树 displayed / hittable 即为 true，没有可等待的状态；`waitForDisplayed`、`mobile: alert` 都无效 |
| 7 | `test/final/s11-busy.js:10` | X | Android | `updateSettings({ waitForIdleTimeout: 0 })` | UiAutomator2 在每个命令前等待界面空闲（默认 10 s）；无限动画使界面永不空闲，每个命令都卡到超时（诊断版 60 s 超时） |
| 8 | `test/final/s12-swipe-delete.js:10` | W3 | iOS | `row.waitForDisplayed()` | `$()` 不等待（同 #3） |
| 9 | `test/final/s13-pull-refresh.js:10` | W3 | iOS | 等 `item-row-1` 显示后再向服务端新增数据 | 同 #3；且首次加载未完成时新增的数据会被首次加载直接带出，不能证明下拉刷新生效 |
| 10 | `test/final/s16-live.js:10` | X | Android | `updateSettings({ waitForIdleTimeout: 0 })` | 同 #7：1 秒轮询 + WebSocket 推送使界面永不空闲 |
| 11 | `test/final/s18-error-retry.js:10` | W3 | iOS | 等 `item-row-1` 显示后再注入错误 | Appium 不等待 app 的网络请求：首次 `GET /items` 尚未到达服务端时注入的错误会被它消耗，之后点 Reload 得到正常结果 |
| 12 | `test/final/s22-notification.js:53` | W3 | iOS | 等通知标题出现在通知中心 | 之后用 `isExisting()`（不等待）判断通知是否被折叠成组，判断前通知必须已送达（3 秒后） |
| 13 | `test/final/s22-notification.js:61` | W3 | iOS | 展开通知组后等 “Show less” 显示 | 等展开动画结束，否则取到的通知卡片位置不对 |
| 14 | `test/final/s23-background.js:16` | W3 | 两平台 | 保存后等 `item-row-501` 出现再结束 app | Appium 不跟踪 app 的网络请求：立刻结束 app 会切断保存请求（诊断版 Android 实测，服务端收到 ECONNRESET） |

“平台”列为该项是因哪个平台的实测失败而加；代码中除 #1、#6、#7、#10、#13 外两平台都执行。

## 汇总（正式版）

按调用点计数（METHODOLOGY 4.2）。

| 平台 | W1 固定 sleep | W2 手写重试 | W3 条件等待 | X 同步绕过 |
|---|---|---|---|---|
| iOS 需要 | 0 | 2（#5、#6） | 10（#1–#4、#8、#9、#11–#14） | 0 |
| Android 需要 | 0 | 0 | 2（#2、#14） | 2（#7、#10） |
| 套件合计（代码中的调用点） | 0 | 2 | 10 | 2 |

## 不计入的项

- 操作方式的变通（不是等待，但脆弱度不同，在 RESULTS.md 中说明）：
  - S3 Android：`setValue` 一次写入整段文字，防抖与逐字输入的语义不符，且被键盘挡住的结果行看不到 → 改为 W3C 按键逐字输入 + `hideKeyboard()`
  - S8 滑块：用 W3C pointer 从滑钮拖到轨道 75% 处（按坐标计算）
  - S22 iOS：对通知卡片的 `click` / `tap()` 被识别成横向滑动 → 右滑卡片露出 “Open” 再点
- 通知权限（S22 iOS）用 `reloadSession` 带 `appium:permissions` 重开会话，是前置条件的设置方式，不是等待
- Android 上 `onPrepare` 中的 `adb reverse`：环境配置，见 SETUP-LOG 第 7 步
