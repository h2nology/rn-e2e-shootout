# Quiesco：等待与同步绕过清单（正式版，0.13.1）

按 METHODOLOGY 4 分类。诊断版（`e2e/diagnostic`）不含以下任何一项；正式版与诊断版的差别只有下表的位置（`diff -r e2e/diagnostic e2e/final`）。

Quiesco 的每个调用都先等 app 空闲（网络、定时器、React、原生转场、元素树稳定等 tracker），动作之后再等一次；断言会重试到成立或超时。这些都是工具默认行为，不计数（METHODOLOGY 4.2）。

0.11.0 起开启 `native-module` tracker（app 侧 `withQuiesco(config, { nativeModules: true })`；0.11.0 另需在 `quiesco.config.mts` 中开启，0.12.0 起包装了原生模块就默认开启（#94）；阈值与忽略列表用默认值）。这是对整个套件生效的 Quiesco 配置项，不是某个调用点的等待，不计入下表；开启的原因与对照见 RESULTS.md 的 S18。

| # | 文件:行 | 类别 | 平台 | 内容 | 为什么需要 |
|---|---|---|---|---|---|
| 1 | `e2e/final/s06-long-list.test.ts:10` | W3 | Android | `scrollTo` 的 `timeoutMs`（0.9.0 起为每一步的超时）10 s → 30 s | 诊断版 Android 1 次在某一步之后的空闲等待中 `SYNC_TIMEOUT`：快速拖动后 FlatList 逐批渲染新行（`setTimeout` 50 ms + React 提交，元素树 4,000+ 节点，CPU 渲染的模拟器），一步之后的空闲超过 10 s（findings.md 0.9.0 N2）。单独运行 6 次都约 36 s 通过，偶发 |
| 2 | `e2e/final/s06-long-list.test.ts:5` | W3 | iOS、Android | 单测超时 120 s → 300 s | 30 多次真实拖动；0.7.0 / 0.8.0 时 Android 正式版超过过 120 s。Appium 同样放宽到 300 s。0.10.0 的正式版中 S6 iOS 约 33 s、Android 35–54 s，但 Android 诊断版（模拟器连续运行约 4 小时）超过 120 s（每步都在 10 s 内空闲，只是总步数 × 每步耗时超过单测超时） |

“平台”列为该项是因哪个平台的实测失败而加；代码中都不按平台分支，两个平台都执行。

## 汇总（正式版，0.13.1）

按调用点计数（METHODOLOGY 4.2）。

| 平台 | W1 固定 sleep | W2 手写重试 | W3 条件等待 | X 同步绕过 |
|---|---|---|---|---|
| iOS 需要 | 0 | 0 | 1（#2） | 0 |
| Android 需要 | 0 | 0 | 2（#1、#2） | 0 |
| 套件合计（代码中的调用点） | 0 | 0 | 2 | 0 |

0.10.0 时未计入的 S22 iOS（#82）已在 0.11.0 修复，不需要等待。

### 各版本的差别

| 版本 | iOS | Android | 说明 |
|---|---|---|---|
| 0.7.0 | W2×1 / W3×1 | W2×2 / W3×1 | 三处 W2 都是绕过工具问题（#44、#45、#47） |
| 0.8.0 | W3×3 | W3×3 / X×1 | `scrollTo` 整体超时（#63）、iOS 通知 runner 启动计时（#64）、原生模块 Promise（#67）、弹窗期间空闲等待挂起（#66） |
| 0.9.0 | W3×1 | W3×2 | 0.8.0 的 S6 `scrollTo` 300 s、S22 30 s、S18 `expectVisible`、S10b `sync: false` 全部去掉，5 轮通过；S6 Android 改为每步 30 s |
| 0.10.0 | W3×1 | W3×2 | 与 0.9.0 相同，未增减。诊断版 Android S6 超过 120 s，即 #2 的情形 |
| 0.11.0 | W3×1 | W3×2 | 调用点与 0.10.0 相同。另开启 `native-module` tracker（配置项）：不开启时 S18 Android 5 轮中 1 次失败（#67），也可以改为在测试中加 W3（`expectVisible('item-row-1')`，0.8.0 的做法），用户选择开启 tracker |
| 0.12.0 | W3×1 | W3×2 | 调用点与 0.11.0 相同。tracker 默认开启，config 中的设置删除 |
| 0.12.1 | W3×1 | W3×2 | 与 0.12.0 相同。Android 第 5 轮 S6 在 #1（每步 30 s）之后仍超时，原因是 FlatList 窗口边缘反复增删（不收敛），不再放宽（RESULTS 第 4 节） |
| 0.13.0 | W3×1 | W3×2 | 与 0.12.0 相同。诊断版 Android S6 在同一位置超时，0.13.0 的报错确认为反复增删（不收敛），不放宽；iOS 第 4 轮 S22 的 `keyboard moving`（iOS 键盘通知迟到 10.4 s）不加等待（RESULTS 第 4 节） |
| 0.13.1 | W3×1 | W3×2 | 与 0.12.0 相同。高负载下 S6 Android 60 步不够、S18 iOS 时机竞争各 1 次，不加等待（RESULTS 第 4 节） |

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
