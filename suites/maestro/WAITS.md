# Maestro：等待与同步绕过清单（正式版）

按 METHODOLOGY 4 分类。诊断版（`flows/diagnostic`）不含以下任何一项。#2、#3 在 `flows/final` 中（`diff -r flows/diagnostic flows/final`）；#1 在两版共用的 `flows/common/reset.yaml` 中，只在正式版执行（`run.sh` 传入 `MAESTRO_VARIANT`）。

Maestro 的每个命令都自带隐式等待（元素出现前自动重试；点击、滑动后等待界面静止），`assertVisible` / `assertNotVisible` 会轮询直到条件成立或超时。这些都是工具默认行为，不计数（METHODOLOGY 4.2）。

| # | 文件:行 | 类别 | 平台 | 内容 | 为什么需要 |
|---|---|---|---|---|---|
| 1 | `flows/common/reset.yaml:23` | W3 | Android | 重置的 `launchApp` 之后 `waitForAnimationToEnd`（等画面静止） | Maestro 在 app 窗口尚不能接收输入时（启动中）就点击第一个元素：注入的 DOWN 被系统丢弃（`Dropping event because all windows would just receive ACTION_OUTSIDE`），但 Android 36 的输入校验仍把这根手指记为按下，之后**所有**注入的点击都被拒绝（`Invalid DOWN event - pointers already down for device -1`），本轮剩余场景全部失败，重启模拟器才恢复。未加时 S1 单独循环约 1/6 发生，全套运行 3 次中 2 次发生；加了之后重启后连续 20 次 0 发生（logcat 中丢弃事件 0 次）。详见 findings.md |
| 2 | `flows/final/s06-long-list.yaml:14` | W3 | 两平台 | `scrollUntilVisible` 的 `timeout` 20 s → 300 s | 滚到第 400 行需要数十次滑动（iOS 约 180 s、Android 约 190 s）。默认 20 s 时诊断版两平台都失败。`speed: 100` 会产生惯性滚动，两次检查之间越过第 400 行（实测滚到列表末尾仍未找到），因此保持默认 speed |
| 3 | `flows/final/s09-webview.yaml:16` | W2 | iOS | `repeat` `while notVisible "Received: hello"` → `tapOn: Send to native`（最多 5 次） | 按钮一出现就点击，网页尚不可交互，点击无效（诊断版全套中 1/1 失败，单独执行 3/3 通过，属于偶发）。页面上没有“可交互”的状态可以等待。先试了 Maestro 文档推荐的“幽灵点击”对策 `retryTapIfNoChange`（点击后界面层级没变化则再点）：WebView 内容仍在变化，被判为“已变化”而不重试，正式版 5 轮中仍失败 1 次（日志 `Something have changed in the UI … Proceed`）→ 改为手写重试。与 Appium 的 W2 #5 相同 |

“平台”列为该项是因哪个平台的实测失败而加；#1 只在 Android 执行，#2、#3 两个平台都执行。

## 汇总（正式版）

按调用点计数（METHODOLOGY 4.2）。

| 平台 | W1 固定 sleep | W2 手写重试 | W3 条件等待 | X 同步绕过 |
|---|---|---|---|---|
| iOS 需要 | 0 | 1（#3） | 1（#2） | 0 |
| Android 需要 | 0 | 0 | 2（#1、#2） | 0 |
| 套件合计（代码中的调用点） | 0 | 1 | 2 | 0 |

## S11 / S15 / S16（同步机制相关）

没有任何同步绕过。但 Maestro 每次点击后都会等待界面静止（有上限），界面一直在变化时每一步都会等到上限才继续，表现为变慢而不是失败：

| 场景 | iOS | Android |
|---|---|---|
| S11 无限动画 | 23 s | 50 s |
| S15 Reanimated | 14 s | 25 s |
| S16 轮询 + WebSocket | 16 s | 约 90 s |

（同一轮正式版的场景耗时；其他只有登录 + 两三步操作的场景在 Android 上约 20–30 s。）`tapOn` 的 `waitToSettleTimeoutMs` 可以缩短这段等待，本套件没有使用。

## 不计入的项

- 场景本身要求的停留：S23 “在后台等 2 秒”。Maestro 没有固定时长的等待命令，用 device-helper 的 `/sleep`（`flows/common/sleep.js`）实现。
- 条件分支（不是等待）：
  - S21：`runFlow when visible: Open`——iOS 的“Open in "rnshootout"?”确认框点过一次后在该模拟器上不再出现（Maestro 文档），出现时才点。
  - S22 iOS：`runFlow when visible: .*Show less`——通知被折叠成组时第一次点击只展开。
- 操作方式的变通（不是等待，但脆弱度不同，在 RESULTS.md 中说明）：
  - S8 滑块：`swipe` 的 `start` / `end` 只能写屏幕坐标，且不能用变量 → 按平台写死屏幕百分比
  - S14 拖拽：没有“拖到某元素”的命令，从 R5 的手柄 `swipe` `direction: UP`（终点为屏幕 10% 高度，越过 R1）
  - S22 iOS：通知卡片上的点击被识别为横向滑动 → 右滑卡片后点 `Open`（与 Appium 相同）
