# Quiesco：等待与同步绕过清单（正式版）

按 METHODOLOGY 4 分类。诊断版（`e2e/diagnostic`）不含以下任何一项；正式版与诊断版的差别只有下表的位置（`diff -r e2e/diagnostic e2e/final`）。

Quiesco 的每个调用都先等 app 空闲（网络、定时器、React、原生转场、元素树稳定等 tracker），动作之后再等一次；断言会重试到成立或超时。这些都是工具默认行为，不计数（METHODOLOGY 4.2）。

| # | 文件:行 | 类别 | 平台 | 内容 | 为什么需要 |
|---|---|---|---|---|---|
| 1 | `e2e/final/s06-long-list.test.ts:9` | W3 | iOS、Android | `scrollTo` 的 `timeoutMs` 10 s → 300 s | `scrollTo` 的整个调用（所有拖动步骤合计）只有一个超时，默认 10 s（`sync.timeoutMs`）。滚到第 400 行约需 37 步，诊断版两个平台都超时（iOS：`SYNC_TIMEOUT`；Android：超时后误报为 `Scrolled … to both ends`，见 findings.md）。`scrollToEdge` / `scrollToIndex` 每一步都有完整的超时，`scrollTo` 没有 |
| 2 | `e2e/final/s06-long-list.test.ts:5` | W3 | iOS、Android | 单测超时 120 s → 300 s | 30 多次真实拖动，模拟器较慢时接近 120 s（0.7.0 时 Android 正式版 5 轮中 1 次超过）。Appium 同样把单测超时放宽到 300 s |
| 3 | `e2e/final/s22-notification.test.ts:15` | W3 | iOS | `openNotification` 的 `timeoutMs` 10 s → 30 s | **Quiesco 0.8.0 的缺陷**：iOS 的 `openNotification` 在启动 XCUITest runner（系统 UI 读取用）之前就开始计时。S22 常是一轮中第一个用到系统 UI 的测试，runner 启动通常约 7 s，正式版第 1 轮用了 14.4 s，第一次读屏返回时已经超时，没有打开通知中心就报“no notification … (seen: nothing)”（读源码确认，见 findings.md）。两平台都执行，Android 不受影响 |
| 4 | `e2e/final/s18-error-retry.test.ts:9` | W3 | Android | 登录后先 `expectVisible('item-row-1')`，再注入错误 | 登录处理依次 await 登录请求 → `AsyncStorage.setItem`（原生模块）→ 跳转首页 → 首页挂载时 `GET /items`。Quiesco 的 tracker 不包括原生模块的 Promise（文档的 tracker 表），`setItem` 期间所有 tracker 空闲，登录的 `tap` 可能在首页首次请求之前就返回；随后注入的 500 被首次请求消耗，Reload 拿到正常列表（Android 正式版 5 轮中 1 次）。Appium 在同一位置有相同的等待 |
| 5 | `e2e/final/s10b-permission.test.ts:11` | X | Android | 打开权限弹窗的 `tap('request-location', { sync: false })` | **Quiesco 的缺陷（0.7.0 起就存在）**：弹窗使 app 进入后台，Android 暂停 JS 定时器；agent 动作后的空闲等待（`sync/wait-for-idle.ts`）只在 AppState 变化的那一刻检查一次，若此时有 tracker 忙，就睡在暂停的定时器上，不再醒来也不会超时，15 s 后宿主报 AGENT_TIMEOUT（Android 正式版 5 轮中 1 次，读源码确认，见 findings.md）。之后的 `system.tap` 会等弹窗出现，`expectText` 回到前台后再同步 |

“平台”列为该项是因哪个平台的实测失败而加；代码中都不按平台分支，两个平台都执行。

## 汇总（正式版）

按调用点计数（METHODOLOGY 4.2）。

| 平台 | W1 固定 sleep | W2 手写重试 | W3 条件等待 | X 同步绕过 |
|---|---|---|---|---|
| iOS 需要 | 0 | 0 | 3（#1、#2、#3） | 0 |
| Android 需要 | 0 | 0 | 3（#1、#2、#4） | 1（#5） |
| 套件合计（代码中的调用点） | 0 | 0 | 4 | 1 |

### 与 0.7.0 的差别

0.7.0 时为 iOS W2×1 / W3×1、Android W2×2 / W3×1。三处 W2 都是绕过工具本身的问题，0.8.0 修复后全部去掉：

| 0.7.0 的项 | 0.8.0 |
|---|---|
| S6 Android：`scrollTo` 在带 RefreshControl 的列表上失效 → 手写 `scroll()` 循环（W2） | 已修复（h2nology/quiesco#44）→ 直接 `scrollTo` |
| S6 iOS：`scrollTo` 露出细边就停、`tap` 点到列表外 → 补一次拖动（W2） | 已修复（#45：停在目标中心露出时、点击可见部分的中心）→ 去掉 |
| S22 Android：`openNotification` 只找 5 秒 → 再试（W2） | 已修复（#47：两平台都等 `timeoutMs`，默认 10 s）→ 去掉。另有 iOS 的新问题（#3，W3） |
| S6 Android 单测超时（W3） | 保留（#2，现在两平台都执行） |
| S6 iOS `scrollTo` 的 `timeoutMs`（W3） | 保留，Android 也需要（#1） |

## S11 / S15 / S16（同步机制相关）

三个场景在两个平台上都**不需要任何同步绕过**，诊断版即通过：

- S11 无限动画、S15 Reanimated：实测诊断版即通过，没有出现 `SYNC_TIMEOUT`（未深究 `frame-stable` tracker 为何没有被循环动画卡住）。
- S16 1 秒轮询 + WebSocket：按文档，`setInterval` 默认不计入忙碌（`sync.countIntervals: false`），已打开的 WebSocket 也不计入；实测诊断版即通过。

## 不计入的项

- 场景本身要求的停留：S23 “在后台等 2 秒”（`setTimeout` 2000 ms）。
- 0.7.0 时的操作方式变通，0.8.0 起全部改为 Quiesco 的 API（不再需要外部命令）：
  - S3：`type(…, { perCharacter: true })` 逐字输入（#52）
  - S8：日期格子用 `system.tap({ text: '25' })` 真实点击，iOS inline 日历（#50）与 Android 日期对话框（#49）相同
  - S21：`openUrl()` 在 app 处于后台时也可调用（#48）
