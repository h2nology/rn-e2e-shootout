# Quiesco：等待与同步绕过清单（正式版）

按 METHODOLOGY 4 分类。诊断版（`e2e/diagnostic`）不含以下任何一项；正式版与诊断版的差别只有下表的位置（`diff -r e2e/diagnostic e2e/final`）。

Quiesco 的每个调用都先等 app 空闲（网络、定时器、React、原生转场、元素树稳定等 tracker），动作之后再等一次；断言会重试到成立或超时。这些都是工具默认行为，不计数（METHODOLOGY 4.2）。

| # | 文件:行 | 类别 | 平台 | 内容 | 为什么需要 |
|---|---|---|---|---|---|
| 1 | `e2e/final/s06-long-list.test.ts:12` | W3 | iOS | `scrollTo` 的 `timeoutMs` 10 s → 300 s | 滚到第 400 行需要数十次滑动，整个调用约 90 s；默认超时下诊断版 `SYNC_TIMEOUT` |
| 2 | `e2e/final/s06-long-list.test.ts:17` | W2 | Android | 自己重复 `scroll('item-list', 'down')` 直到 `item-row-400` 可见（最多 120 次） | **Quiesco 0.7.0 的缺陷**：带 `RefreshControl` 的列表在 Android 上被 `AndroidSwipeRefreshLayout` 包住，agent 把包装层当作滚动视图，测到的偏移恒为 0，`scrollTo` 拖一次就判定“已到两端”（`Scrolled … to both ends without finding …`；读 agent 源码确认，见 findings.md）。不改工具，在测试中绕过 |
| 3 | `e2e/final/s06-long-list.test.ts:25` | W2 | iOS | 目标行没有完全显示时再做一次真实拖动，`expectVisible(…, { ratio: 1 })` 后再点 | **Quiesco 0.7.0 的缺陷**：`scrollTo`（及 #2 的循环）在目标行露出一条细边时就停下，`tap` 却瞄准整行矩形的中心，可能落在列表上方的标题栏；遮挡检查不考虑祖先的裁剪，点击“成功”却没点到行（iOS 5 轮中 2 次失败；失败时 `item-row-400` 只露出 1–15 pt，读 agent 源码确认，见 findings.md）|
| 4 | `e2e/final/s22-notification.test.ts:17` | W2 | Android | `openNotification` 失败时再试（最多 3 次） | Android 的 `openNotification` 只在通知栏中找 5 秒（写死，不受 `timeoutMs` 影响；iOS 为 10 秒），通知在切到后台后约 5 秒才发出，时间踩线（诊断版失败）。通知不以横幅出现，`system.expectVisible` 等不到（实测），没有可等待的状态 |
| 5 | `e2e/final/s06-long-list.test.ts:7` | W3 | Android | 单测超时 120 s → 300 s | 重启后第一轮的 Android 模拟器较慢（每次滚动 4–5 s），S6 超过 120 s（正式版 5 轮中 1 次，`TestTimeoutError`）。Appium 同样把单测超时放宽到 300 s |

“平台”列为该项是因哪个平台的实测失败而加；#1、#2 按平台分支，#3、#5 两个平台都执行，#4 只在 Android 重试。

## 汇总（正式版）

按调用点计数（METHODOLOGY 4.2）。

| 平台 | W1 固定 sleep | W2 手写重试 | W3 条件等待 | X 同步绕过 |
|---|---|---|---|---|
| iOS 需要 | 0 | 1（#3） | 1（#1） | 0 |
| Android 需要 | 0 | 2（#2、#4） | 1（#5） | 0 |
| 套件合计（代码中的调用点） | 0 | 3 | 2 | 0 |

W2 三处都是绕过工具本身的问题（#2、#3 为缺陷，#4 为写死的等待时间），不是 app 的同步问题。

## S11 / S15 / S16（同步机制相关）

三个场景在两个平台上都**不需要任何同步绕过**，诊断版即通过：

- S11 无限动画、S15 Reanimated：实测诊断版即通过，没有出现 `SYNC_TIMEOUT`（未深究 `frame-stable` tracker 为何没有被循环动画卡住）。
- S16 1 秒轮询 + WebSocket：按文档，`setInterval` 默认不计入忙碌（`sync.countIntervals: false`），已打开的 WebSocket 也不计入；实测诊断版即通过。

## 不计入的项

- 场景本身要求的停留：S23 “在后台等 2 秒”（`setTimeout` 2000 ms）。
- 条件分支（不是为稳定而加）：`e2e/support.ts:52`，S21 用外部命令打开深链接后，iOS 的“Open in "rnshootout"?”确认框出现时才点（点过一次后该模拟器不再出现；为判断是否出现最多等 3 秒）。
- 操作方式的变通（不是等待，但脆弱度不同，在 RESULTS.md 中说明）：
  - S3：`type()` 一次写入整段文字（iOS `insertText`、Android `commitText`），不满足“逐字输入” → 每个字符调用一次 `type()`
  - S8 iOS：inline 日历的日期格子不在元素树中 → 按 `control-date-picker` 内的相对坐标点击（依赖 en_US 的周日开头）
  - S8 Android：系统日期对话框是 app 的独立窗口，Quiesco 的真实触摸到不了，只能 `setValue`（场景禁止）→ 外部命令（`uiautomator dump` + `adb shell input tap`）
  - S21：`openUrl()` 不能在后台调用 → 外部命令（`simctl openurl` / `am start`）+ `bringToForeground()`
