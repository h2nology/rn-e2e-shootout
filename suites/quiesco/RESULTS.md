# Quiesco：接入结果（M3）

- 版本：quiesco / @quiesco/* **0.13.3**（METHODOLOGY v13；首次接入为 0.7.0，之后 0.8.0、0.9.0、0.10.0、0.11.0、0.12.0、0.12.1、0.13.0、0.13.1、0.13.2、0.13.3），Vitest 5.1.1
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，`npx quiesco build ios|android --clean`（`npm run build:*`；Android 另加 `GRADLE_OPTS=-Dorg.gradle.jvmargs=-Xmx4g`，与其他工具相同）
- **对 app 的改动**：`@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin` 依赖；`app.json` 的 config plugin；`metro.config.js`（`withQuiesco(config, { nativeModules: true })`，0.11.0 起加 `nativeModules`，见下）；`index.ts` 入口（第一行 import agent）；根布局包 `<QuiescoRoot>`。非 e2e 构建中 plugin 把 native 模块排除出自动链接、metro 把 agent 换成空实现。0.7.0 时 C10 需要的 `CFBundleLocalizations` 在 0.8.0 中已去掉
- 同步配置：0.11.0 起开启 Quiesco 的 `native-module` tracker（用户决定，2026-11-20，原因见 S18）。0.11.0 需在 `quiesco.config.mts` 的 `sync.trackers` 中开启；0.12.0 起 app 侧包装了原生模块就默认开启（#94），config 中的设置已删除。阈值与忽略列表用默认值。这是 Quiesco 自己的配置项，不计入 WAITS
- 重置：见 METHODOLOGY 5 的表（Quiesco 默认的 soft reset 粒度不同，另外用 `relaunch({ clearData: true })` 补齐；hook 放在 `setupFiles`）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)；工具问题：见 findings.md（h2nology/quiesco#44–#55 已在 0.8.0 关闭，#63–#68 已在 0.9.0 关闭，#74–#78 已在 0.10.0 关闭，#82–#87 已在 0.11.0 关闭，#92–#96 已在 0.12.0 关闭，#100 已在 0.12.1 关闭，#102 已在 0.13.0 关闭，#104 已在 0.13.1 关闭，#107 已在 0.13.2 关闭，#109、#110 已在 0.13.3 关闭）
- **披露**：接入使用了 Quiesco 官方的 Claude Code 插件（METHODOLOGY v4）；执行者代表 Quiesco 作者一方

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Quiesco API 以外的外部命令或对 app 的额外改动；需额外说明 = 用了与场景描述不同的方式。

## 0. 状态：**达到 M3 完成标准**（两平台连续 5 轮全绿）

0.13.3：**两平台 5 × 24 / 24**（2026-11-23），诊断版两平台 24 / 24，能力检查同 0.12.0（iOS 12 / 12、Android 仅 C11 ✗）。**Android 每个场景多出的约 1.7 s 已消失**（#109 修复，各场景回到 0.13.1 的耗时）。S6 本次 Android 5 / 5 未失败；之后单独反复运行诊断版 S6（Android）实测 #110：7 次中失败 2 次，第 7 次正是“超时落在稳定帧”的情形，报错列出 `frame-stable (idle at the timeout, busy 45ms before it)` 及反复增删的说明，**#110 修复确认**（第 4 节）。iOS S8 中位数 13.7 → 26.0 s、整轮约 +14 s：Vitest 按上次耗时排序后 S8 排到第 2 个，成为第一个用 `system.*` 的测试、承担 XCUITest runner 启动（8–12 s），不是 0.13.3 的改动（`@quiesco/core` 只改了 timeline），见第 4 节。

0.13.2：iOS 5 × 24 / 24、Android 24、24、23、24、23 / 24（第 3、5 轮 S6）（2026-11-22），诊断版两平台 24 / 24，能力检查同 0.12.0。S18 iOS 的时机竞争已修复（#107）。两次 S6 都是已知的 FlatList 窗口边缘反复增删（第 5 轮的报错没有指出这一点，h2nology/quiesco#110）。**Android 每个场景多约 1.7 s**：0.13.2 把 `ExpoNotificationsEmitter.addListener()`（事件订阅）算作等待回调的原生调用，每次启动 app 后的第一个操作等满 2 s 上限（h2nology/quiesco#109）。见第 4 节。

0.13.1：iOS 23、24、24、24、24 / 24（第 1 轮 S18）、Android 23、24、24、24、24 / 24（第 1 轮 S6）（2026-11-22），诊断版 iOS 24 / 24、Android 23 / 24（S6），能力检查同 0.12.0。两个 S6 失败与前两轮的慢都发生在宿主机高负载时段，S18 是测试与 app 的时机竞争，都与 0.13.1 的改动（iOS 键盘）无关，见第 4 节。

0.13.0：iOS 24、24、24、23、24 / 24（第 4 轮 S22，见第 4 节）、Android 5 × 24 / 24（2026-11-22），诊断版 iOS 24 / 24、Android 23 / 24（S6，见第 4 节），能力检查同 0.12.0。运行中 Android 模拟器进程一度退出（见第 4 节），Android 正式版在冷启动模拟器后重跑。

0.12.1：iOS 5 × 24 / 24、Android 24、24、24、24、23 / 24（2026-11-21；第 5 轮 S6，见第 4 节），诊断版两平台 24 / 24，能力检查 iOS 12 / 12、Android 仅 C11 ✗。

0.12.0：两平台 5 × 24 / 24，能力检查 iOS 12 / 12（C1 在整套中通过，#92 修复）。

0.11.0 + `native-module` tracker 时同为两平台 5 × 24 / 24。0.10.0 时 iOS 未通过的 S22（#82）在 0.11.0 修复。tracker 关闭时 Android 第 1 轮 S18 失败 1 次（#67 的已知限制），按用户决定开启 tracker。

## 1. 场景 S1–S23（正式版，0.13.3）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `type(…, { perCharacter: true })` 逐字输入 |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | `scrollTo`（真实拖动直到目标中心露出）。单测超时 300 s（W3）；每一步的空闲等待 30 s（W3）。0.11.0 正式版 iOS 33–60 s、Android 35–165 s；0.12.0 iOS 46–51 s、Android 34–36 s（宿主机负载低）；0.12.1 iOS 约 49 s、Android 35 s × 4 + 第 5 轮失败（第 21 步之后 30 s 不空闲，FlatList 窗口边缘一行反复增删，见第 4 节）；0.13.0 iOS 约 49 s、Android 35 s × 5，诊断版 Android 在同一位置失败（0.13.0 的报错确认为反复增删）；0.13.1 iOS 约 48 s，Android 第 1 轮失败（60 步上限，宿主机负载，见第 4 节）、第 2 轮 73 s、第 3–5 轮 35 s；0.13.2 iOS 约 49 s，Android 第 3、5 轮失败（第 21 步，FlatList 反复增删，见第 4 节），其余 3 轮约 39 s（含每次启动 +2 s，#109）；0.13.3 iOS 约 50 s、Android 35 s × 5。耗时由两件事决定：① 重启后的第一个测试多出 15–20 s 冷启动（Vitest 按上次耗时排序，0.11.0 起 S6 排第一，0.10.0 时由 S22 / S12 承担，整轮耗时不变）；② 宿主机负载（Android 模拟器 CPU 渲染，负载约 5 时约 35 s，负载 10–16 时 90–165 s；tracker 开 / 关对照无差别，见 findings.md 0.11.0）。Detox 约 120 s、Maestro 约 190 s（各自的测量条件）。`scrollToIndex` 是 app 内部方法，场景禁止 |
| S7a 中日文（文本 API） | ✓ | ✓ | `type()` |
| S7b 中日文（经由输入法） | ✓（能力检查） | ✗ | iOS：外部命令登记拼音 / 日文键盘后，按键与候选词经 `system.tap` 点击。0.10.0 中先失败 4 次（模拟器设置被用户重建后，写入 `AppleKeyboards` 不再生效，软键盘只有英文）；用户在模拟器“设置”中手动添加中文拼音 / 日文罗马字键盘后 2 / 2 通过（与 Quiesco 无关，测试代码未改）。Android：AOSP 镜像没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 开关 `tap`；滑块 `adjustSlider`（真实拖动）；日期：两平台都 `system.tap({ text: '25' })`。0.11.0 开启 tracker 后 Android 多约 2 s（日期选择器的原生调用算作忙碌），0.12.0 默认忽略列表含 `RNCDatePicker.open`，恢复到 12.8 s（#93）。0.13.3 iOS 23.0–27.5 s（之前约 13.7 s）：S8 排到每轮第 2 个、承担 XCUITest runner 启动（第 4 节） |
| S9 WebView | ✓ | ✓ | `app.webview()` |
| S10a 预先授权 | ✓ | ✓ | `setPermission('location', 'grant')` |
| S10b 点击系统权限弹窗 | ✓ | ✓ | `system.tap`。0.8.0 的 `{ sync: false }`（#66）已去掉。0.11.0 开启 tracker 后 Android 多约 2 s（权限请求），0.12.0 恢复到 8.9 s（#93） |
| S11 无限动画 | ✓ | ✓ | 不需要同步绕过 |
| S12 左滑删除 | ✓ | ✓ | `swipe`。0.9.0 中 app 崩溃（#74），0.10.0 修复。0.11.0 开启 `native-module` 包装后仍通过（Gesture Handler / Reanimated / Worklets 模块不包装） |
| S13 下拉刷新 | ✓ | ✓ | |
| S14 长按 / 拖拽 | ✓ | ✓ | |
| S15 Reanimated | ✓ | ✓ | 不需要同步绕过 |
| S16 轮询 / WebSocket | ✓ | ✓ | 不需要同步绕过 |
| S17 Toast | ✓ | ✓ | |
| S18 错误与重试 | ✓ | ✓ | 测试代码无等待。0.13.1 iOS 第 1 轮失败 1 次（tracker 开启后首次；登录的 `tap` 在登录响应与首页首次 `/items` 之间的 30 ms 内返回，见第 4 节）。0.13.2 修复（#107：AsyncStorage 2 的 `setItem` 调用 `multiSet(pairs, callback)`，不返回 Promise，tracker 原先看不到；现在带回调的调用在第一次回调前算忙碌）后两平台 5 / 5。**依赖 `native-module` tracker**：登录后 app 在 `await AsyncStorage.setItem` 期间所有默认 tracker 空闲，登录的 `tap` 可能在首页首次 `/items` 前返回，测试注入的一次性 500 被首次请求用掉（#67，tracker 默认关闭、文档写明）。0.11.0 tracker 关闭时 Android 5 轮中 1 次失败（0.8.0 也是 5 轮中 1 次；0.9.0 / 0.10.0 的 5 / 5 是时机上的运气）。开启后两平台 5 / 5；0.12.0（默认开启）两平台 5 / 5。Appium 在同一处需要等待 |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | |
| S21 深链接 | ✓ | ✓ | 热启动：后台时 `openUrl()`；冷启动：`terminate()` + `relaunch({ url })` |
| S22 本地通知 | ✓ | ✓ | `openNotification`，默认超时。0.10.0 时 iOS 5 轮中 1 次失败（#82，通知中心路径上 “Open” 的点击时机），0.11.0 修复后 iOS 5 / 5（且 0.11.0 起 runner 在 `sendToBackground()` 时预先启动），0.12.0 正式版 5 / 5。0.12.0 的 iOS 诊断版失败 1 次（runner 冷启动 12.3 s 错过横幅 + 通知中心里有前一天的同 app 通知堆叠 → 10 s 超时，见第 4 节，#100），重跑通过。0.12.1 修复（#100）后，正式版第 2、3 轮走了通知中心路径（堆叠展开 → “Open”），都通过（34.4 s、27.5 s）。0.13.0（`@quiesco/core` 未改）正式版第 4 轮失败：登录输入密码时 iOS 的键盘显示完成通知迟到 10.4 s（UIKit 等剪贴板读取），`native` tracker 一直报 `keyboard moving`，见第 4 节（#104）。0.13.1 修复（键盘 “moving” 以动画时长 + 0.5 s 为上限）后 iOS 5 / 5；这次运行中没有出现迟到的 `didShow`，上限路径未被触发。通知权限不能预先授予，依赖本模拟器已授予的状态（见 SETUP-LOG 0.10.0） |
| S23 前后台 | ✓ | ✓ | |

### 诊断版（不加任何等待）

| 平台 | 结果 | 说明 |
|---|---|---|
| iOS | 24 / 24 | 0.13.3、0.13.2、0.13.1、0.13.0、0.12.1：24 / 24。0.12.0：第 1 次 S22 失败（#100），重启后重跑 24 / 24。0.11.0 时 tracker 开启前、开启后各 1 次，都 24 / 24 |
| Android | 24 / 24 | 0.13.3、0.13.2：24 / 24。0.13.1：S6 失败（单测 120 s 超时，开始时宿主机 load average 31–40）。0.13.0：S6 失败（10 s 超时，FlatList 窗口边缘一行反复增删，报错直接指出，见第 4 节）。0.12.1、0.12.0、0.11.0 都 24 / 24 |

0.7.0 时为 iOS 20 / 24、Android 21 / 24；0.8.0 时为 iOS 22 / 24、Android 23 / 24；0.9.0 时为 iOS 23 / 24、Android 22 / 24；0.10.0 时两平台 24 / 24（环境恢复、按规则重启后）；0.11.0 时两平台 24 / 24；0.12.0 时 iOS 23 / 24（S22）、Android 24 / 24；0.12.1 时两平台 24 / 24；0.13.0 时 iOS 24 / 24、Android 23 / 24（S6）；0.13.1 时 iOS 24 / 24、Android 23 / 24（S6，高负载）；0.13.2 时两平台 24 / 24。

### 连续 5 轮（正式版，每轮前重启模拟器）

0.13.3（2026-11-23，`scripts/full-check.sh`，`caffeinate` 下运行，区间内无睡眠事件；构建后等 load average 降到 10 以下再开始：构建结束时 51，等 121 s 后 8.4，结束时约 7）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 24、24、24、24、24 / 24 | 351、350、350、350、349 s | — |
| Android | 24、24、24、24、24 / 24 | 224、228、226、224、227 s | — |

- Android 回到 0.13.0 / 0.13.1 的约 225 s（0.13.2 为 274–290 s）。
- iOS 每轮比 0.13.2 多约 14 s，几乎都在 S8（runner 启动，见第 4 节）。

0.13.2（2026-11-22，`scripts/full-check.sh`，`caffeinate` 下运行，区间内无睡眠事件；构建后等 1 分钟 load average 降到 10 以下再开始：开始时 9.8，结束时约 17）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 24、24、24、24、24 / 24 | 336、334、335、344、338 s | — |
| Android | 24、24、23、24、23 / 24 | 274、278、289、274、290 s | 第 3、5 轮 S6（FlatList 反复增删，见第 4 节） |

- Android 每轮比 0.13.0 / 0.13.1（负载低时约 225 s）多约 50 s：每个场景 +1.4–1.8 s，每个场景启动 app 一次（`relaunch`），S8、S21 等启动两次的场景 +3.5 s（#109，见第 4 节）。

0.13.1（2026-11-22，同上；开始时 load average 31–40，结束时约 7）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 23、24、24、24、24 / 24 | 349、337、336、344、337 s | 第 1 轮 S18（见第 4 节） |
| Android | 23、24、24、24、24 / 24 | 340、270、228、226、225 s | 第 1 轮 S6（60 步上限，见第 4 节） |

0.13.0（2026-11-22，同上）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 24、24、24、23、24 / 24 | 355、340、347、347、347 s | 第 4 轮 S22（SYNC_TIMEOUT `keyboard moving`，见第 4 节） |
| Android | 24、24、24、24、24 / 24 | 224、225、226、225、227 s | — |

Android 第一次的 5 轮无效：第 2 轮 S7a 中模拟器进程退出（00:47，无崩溃报告、无睡眠事件、内存与磁盘正常，原因不明），之后的场景都找不到设备，`full-check.sh` 停在重启脚本的 `adb wait-for-device`。冷启动模拟器后重跑 5 轮（上表）与能力检查。日志保存在 `logs/q0130-final-aborted/`（不入库）。

0.12.1（2026-11-21，同上）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 24、24、24、24、24 / 24 | 347、341、339、341、343 s | — |
| Android | 24、24、24、24、23 / 24 | 225、227、228、224、241 s | 第 5 轮 S6（SYNC_TIMEOUT，见第 4 节） |

0.12.0（2026-11-21，同上）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 24、24、24、24、24 / 24 | 337、338、337、344、336 s | — |
| Android | 24、24、24、24、24 / 24 | 225、226、225、224、226 s | — |

0.11.0 + `native-module` tracker（2026-11-21）：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 24、24、24、24、24 / 24 | 348、337、345、343、344 s | — |
| Android | 24、24、24、24、24 / 24 | 231、368、318、313、338 s | — |

- 0.11.0 Android 第 2–5 轮耗时多出的部分几乎都在 S6（宿主机负载，见 S6 行）。0.12.0 运行时负载低，S6 Android 约 35 s。
- 各场景中位数 0.12.0 与 0.11.0 基本相同（±0.3 s），差别只在 Android S8 / S10b（#93，各 −2 s）。0.12.1 与 0.12.0 基本相同；iOS S23 21.7–26.4 s（0.12.0 21.7–25.5 s），0.12.1 的改动不在其路径上，视为波动。0.13.0 与 0.12.1 基本相同（去掉 S6 / S12 / S22 / S23 与每轮第一个场景后，iOS 每轮 234–239 s，0.12.1 233–237 s）；iOS S22 中位数 21.9 s（0.12.1 17.8 s）来自 runner 启动时间（8.1–15.5 s）与第 5 轮 S22 排在第一个（冷启动，36.3 s），0.13.0 没有改 `@quiesco/core`。0.13.1 与 0.13.0 基本相同（±0.5 s）；iOS S18 中位数 11.8 s 来自第 1 轮 S18 排第一个（冷启动），Android S8 中位数 13.8 s 来自高负载的第 1–3 轮（第 4、5 轮 12.8 / 12.6 s）。0.13.2：iOS 与 0.13.1 相同（各场景中位数之和 333 s，0.13.1 336 s；S18 −1.8 s、S22 −2.8 s 来自排序与 runner 启动）；**Android 每个场景 +1.4–1.8 s**（S2 4.2 → 5.9 s、S1 5.8 → 7.6 s；启动两次的 S8、S21 +3.5 s），中位数之和 225 → 272 s（此处原记 451 → 543 s / iOS 671 → 665 s，是把 Vitest 输出中文件行与测试行各算一次的重复计数，0.13.3 时更正）。原因是 #109（每次启动后的第一个操作等 `ExpoNotificationsEmitter.addListener()` 到 2 s 上限，timeline 实测），不是负载。这部分不是测试代码的等待，不计入 WAITS；速度对比在修复前不能用 0.13.2 的 Android 数据。0.13.3：**Android 各场景回到 0.13.1 的耗时**（中位数之和 224 s，0.13.1 225 s；S2 4.3 s、S1 5.8 s，S8 12.8 s、S21 8.4 s），#109 修复确认。iOS 中位数之和 346 s（0.13.2 333 s），差别几乎都在 S8（+12.4 s，runner 启动转到 S8，第 4 节）；S22 −1.3 s；其余 ±0.6 s 以内。
- iOS 第一次的 5 轮无效：运行中 macOS 进入睡眠（Idle Sleep / Maintenance Sleep / Dark Wake Thermal Emergency），每个失败都与 `pmset -g log` 的一次睡眠逐秒对应（findings.md 0.11.0）。之后用 `caffeinate -dimsu` 包住整个运行重跑，运行区间内无睡眠事件。日志保存在 `logs/q0110nm-final-bad/`（不入库）。
- tracker 关闭时（0.11.0，2026-11-20）：iOS 5 × 24 / 24（335–344 s）；Android 23、24、24、24、24（第 1 轮 S18）。

## 2. 能力检查 C1–C11（0.12.0；0.12.1、0.13.0、0.13.1、0.13.2、0.13.3 结果相同）

`e2e/capability/`。各项至少 1 次通过。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | ✓ | ✓ | `biometrics.enroll()` / `fail()` / `match()`；“取消”用 `system.tap`。**0.12.0 起 iOS 在整套能力检查中通过**（#92 修复：也读 `LocalAuthenticationUIService` 的树）。0.10.0 / 0.11.0 时 iOS 在整套能力检查中失败（0.11.0：2 次中 2 次，0.10.0：1 次中 1 次，都是 `system.tap` 10 s 内找不到 Face ID 对话框中的 “Cancel”，屏幕上只读到 “Biometric / Unlock / Locked”）。单独运行：0.11.0 重启后 2 次中第 2 次通过，0.10.0 2 / 2 通过。0.9.0 时为点击丢失（#87，0.11.0 已修复）。原因：模拟器启动后第一次出现的 Face ID 对话框不在 SpringBoard 的树中，Quiesco 读不到（h2nology/quiesco#92） |
| C2 跨 app 登录 | ✓ | ✓（GAPIS） | iOS：确认框 `system.tap({ text: 'Continue' })`，认证页面经 `system.type`。Android：Custom Tab 中 `system.type`（AOSP 镜像上经 WebView shell 也通过，不作为结果） |
| C3 分享面板 | ✓ | ✓ | iOS：`system.expectVisible({ text: 'Copy' })` 后 `system.tapAt` 点面板外关闭。0.9.0 时 iOS 整套中 3 次里失败 1 次（点击后面板未关闭，#87），0.10.0 整套中通过。Android：`system.expectVisible` 后 `pressBack()` |
| C4 选择器 | ✓ | ✓ | `{ id: 'dup-row', index: 2 }`；`{ label: 'Secret button' }` |
| C5 嵌套滚动 | ✓ | ✓ | `scrollTo('carousel', 'carousel-slide-6')` |
| C6 启动阶段 | ✓ | ✓ | 冷启动后直接 `type()` |
| C7 远程图片 | ✓ | ✓ | |
| C8 深色模式 | ✓ | ✓ | `setAppearance()` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation()` |
| C10 系统语言 | ✓（需额外说明） | ✓（需额外说明） | `setLocale()`。iOS：以 `-AppleLanguages` 重新启动（`Intl` 与原生字符串仍为 bundle 的语言）。Android：per-app language，不是改系统语言 |
| C11 远程推送 | ✓ | ✗ | iOS：`push-ios.sh`（`simctl push`）+ `openNotification()`。Android：模拟器没有推送服务，与其他工具同为 ✗ |

## 3. 各版本的比较

| 项 | 0.7.0 | 0.8.0 | 0.9.0 | 0.10.0 | 0.11.0 | 0.12.0 | 0.12.1 | 0.13.0 | 0.13.1 | 0.13.2 | 0.13.3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 等待（WAITS） | iOS W2×1 / W3×1；Android W2×2 / W3×1 | iOS W3×3；Android W3×3 / X×1 | iOS W3×1；Android W3×2 | 同 0.9.0（代码中 W3×2，两平台都执行） | 同 0.9.0（W3×2）；开启 `native-module` tracker（Quiesco 配置） | 同 0.9.0（W3×2）；tracker 默认开启，无需配置 | 同 0.12.0 | 同 0.12.0 | 同 0.12.0 | 同 0.12.0 | 同 0.12.0 |
| 外部命令 / 额外配置 | S8 Android、S21、C2 Android、C10 iOS（app 侧）、构建脚本 | S7b iOS 键盘登记、构建脚本 | S7b iOS 键盘登记、Gradle 内存 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 |
| 能力检查 | iOS C2 ✗、C3 ✗、S7b ✗ 等 | iOS 全部 ✓；Android C11 ✗ | 同 0.8.0（iOS C1 / C3 偶发失败） | Android 同 0.9.0；iOS C1 整套中失败（单独 ✓）；S7b 在环境恢复后 ✓ | 同 0.10.0（iOS C1 整套中失败，单独 ✓；Android C11 ✗） | **iOS 全部 ✓**（C1 整套中通过）；Android C11 ✗ | 同 0.12.0 | 同 0.12.0 | 同 0.12.0 | 同 0.12.0 | 同 0.12.0 |
| 连续 5 轮 | 两平台 5 × 24 / 24 | iOS 3 / 5（S22）、Android 3 / 5（S6） | 两平台 0 / 5（S12 每轮，#74）；其余 23 场景 5 / 5 | iOS 4 / 5（S22，#82）；**Android 5 / 5** | **两平台 5 / 5**（tracker 开启；关闭时 Android 4 / 5，S18） | **两平台 5 / 5** | iOS 5 / 5；Android 4 / 5（S6，FlatList） | iOS 4 / 5（S22，键盘通知迟到）；Android 5 / 5（诊断版 S6） | iOS 4 / 5（S18，时机竞争）；Android 4 / 5（S6，高负载） | **iOS 5 / 5**；Android 3 / 5（S6，FlatList）；Android 每场景 +1.7 s（#109） | **两平台 5 / 5**；Android 每场景 +1.7 s 消失（#109）；iOS S8 承担 runner 启动（排序） |

## 4. 未解决的问题

- **iOS S8 中位数 13.7 → 26.0 s、每轮约 +14 s（0.13.3，测试顺序）**：录下时间线重跑 S8 三次（22.1–24.8 s）：`tap('control-date')` 之后的 `system.tap({ text: '25' })` 用了约 5.3 s，设备日志中 XCTest 守护进程在这之后才连上 app；runner 日志 `iOS system UI runner ready in 8302–12299 ms` 每轮都出现在 S8。Vitest 按上次耗时排序，0.13.3 的 5 轮中 S8 都排在 S6 之后的第 2 个，成为每轮第一个用 `system.*` 的测试，承担 XCUITest runner 的启动；0.13.1 / 0.13.2 时由 S22 / S23 承担。S22 中 runner 启动与等通知的时间重叠（`openNotification()` 不计 runner 启动时间），所以那时整轮不显慢；S8 中没有可重叠的等待，整轮多出约 10–13 s。S8 慢了又会继续排在前面（自我强化）。0.13.3 的 `@quiesco/core` 只改了 `src/timeline.ts`（`npm diff`），runner 未变 → 不是 0.13.3 的回退。**M4 harness 需固定测试顺序（或在计时外预先启动 runner），否则单个场景的耗时取决于排序。**
- **Android 每个场景多约 1.7 s（0.13.2，#109；0.13.3 已修复，各场景回到 0.13.1 的耗时）**：录下时间线（`QUIESCO_ARTIFACTS=all`）重跑 S1、S2：每次 `relaunch` 后第一个操作的空闲等待约 2,000 ms，忙碌为 `native-module: ExpoNotificationsEmitter.addListener() 1970ms`。根布局在 effect 中调用 `Notifications.addNotificationResponseReceivedListener(…)` → Expo 模块的 `addListener(eventName, listener)` 把监听函数传给原生；0.13.2 起参数中有函数的原生调用在函数第一次被调用前算忙碌（`@quiesco/agent` `src/sync/native-module.ts:240`），事件监听只有事件到来时才被调用 → 一直“pending”到 `nativeCallThresholdMs`（2,000 ms）。更早开始的 `ExpoPushTokenManager.addListener()` 等已超过 2 s、不再计入。iOS 同一测试的等待中没有出现这些调用（原因未查），耗时不变。不影响通过率；可用 `sync.ignoreNativeCalls` 绕过，但本仓库保持 Quiesco 默认值，不加。已提交 h2nology/quiesco#109（2026-11-22，建议默认忽略 `*.addListener`）。
- **#110 实测（0.13.3，2026-11-23）**：`QUIESCO_ARTIFACTS=all VARIANT=diagnostic` 单独反复运行 S6（Android，load 4–6），7 次中第 3、7 次失败，都在 `scrollTo` 第 39 步（offset 约 18,140）10 s 超时，原因同为 FlatList 窗口边缘反复增删（`children=268 ↔ 269`，20 / 20 次）。第 3 次超时那一刻 frame-stable 本身忙碌（旧路径也会列出），新增的 `react (idle at the timeout, busy 87ms before it)` 一行出现。**第 7 次是 #110 的原情形**（超时落在稳定帧：`idle-state.json` 中 frame-stable `idle: true`，`lastWait` 为 `element tree changed 106 times, stable for 2/2 frames when the wait ended`）：报错仍列出 `frame-stable (idle at the timeout, busy 45ms before it): … the same change went back and forth in 20 of the last 20 changes …`，0.13.2 第 5 轮只列 timer 的问题已修复。timeline 中失败的等待有最后几次检查，`scrollTo` 第 1–39 步各有自己的等待记录。日志 `logs/q0133-s6-loop{1..7}.log`。
- **S6 Android 正式版第 3、5 轮失败（0.13.2；#110 在 0.13.3 修复并实测确认，见上）**：都在 `scrollTo` 第 21 步之后 30 s 不空闲。第 3 轮的报错与 0.13.0 相同（frame-stable：`children=268 ↔ 269` 来回 20 / 20 次，350 次变化 / 29.6 s）。第 5 轮的报错只列出 `timer: setTimeout(anonymous, 50ms)`。插件 `failure-investigator` 读证据（执行者核对源码）：两轮的元素树相同（4318 个节点、列表内容 268 个子元素、已渲染 1–10 与 67–322 行），设备日志无错误、无 GC / 掉帧，第 1–20 步每步 0.53–0.64 s → 很可能是同一个反复增删（推断，置信度中高）。第 5 轮看不出来，是因为 `wait-for-idle.ts` 的超时报错只列超时那一刻忙碌的 tracker，而 `frame-stable.ts:176` 在最后一次采样稳定时丢弃整个等待的变化记录（`idle-state.json` 中无 `lastWait`）；0.13.2 新增的“等待如何结束”记录也不附在失败的等待和 `scrollTo` 每一步上。按现状记录（不改 app）；提交 h2nology/quiesco#110（2026-11-22，超时时保留有变化的记录、列出最近几次检查中忙碌过的 tracker）。
- **S6 Android 在高负载下失败（0.13.1）**：诊断版单测 120 s 超时；正式版第 1 轮 `Gave up scrolling { id: "item-list" } after 60 steps at offset {"x":0,"y":19476} (no end reached)`（第 400 行在约 20,600 px）。正式版第 1 轮每步耗时从开始的 0.53–0.58 s 增加到中位数 1.84 s，后期每步的空闲等待 0.8–2.1 s，日志中 GC 每 15–20 s 一次；平均每步滚动约 325 px（0.12.1 失败时前 21 步约 465 px / 步）→ 负载下拖动产生的滚动距离变短，60 步不够。full-check 开始时（Android 构建刚结束）load average 31–40，结束时约 7；第 2 轮 S6 73 s，第 3–5 轮 35 s。与已知的 S6 负载敏感（下方）同源，0.13.1 没有改 Android 代码。报错建议 `scrollToIndex`，但场景禁止调用 app 内部方法。M4 必须固定宿主机负载（构建后等负载降下来再开始）。
- **S18 iOS 正式版第 1 轮失败（0.13.1，0.13.2 已修复）**：`expect visible failed after 10000ms for { id: "error-view" }`。设备日志：POST /login 响应 21.101 → 首页首次 GET /items 21.132 发出并得到 500（测试注入的一次性 500 被它用掉）→ `list-reload` 的请求得到 200，错误视图不出现。即登录的 `tap`（动作后的空闲等待 277 ms）在登录响应与首页请求之间的 30 ms 内返回（app：`AsyncStorage.setItem` → `router.replace('/')` → 首页 `useEffect` 中 `items.load()`）。键盘收起（`willHide` 21.148）在请求之后，没有 `no Did notification` 行 → 与 0.13.1 的改动无关。`native-module` tracker 开启后（0.11.0 起）15 轮中首次。证据只有最终状态，哪个间隙让各 tracker 连续两次检查都空闲无法确定（推测为 React 提交后、passive effect 之前）→ 提交 h2nology/quiesco#107（改进诊断、考虑更长的确认）。
- **S6 Android 诊断版失败（0.13.0）**：与 0.12.1 正式版第 5 轮同一位置（`scrollTo` 第 21 步，偏移 9768，10 s 超时）。0.13.0 的报错（#102）直接给出：`the same change went back and forth in 20 of the last 20 changes`（`children=269 ↔ 268`），约每 67 ms 一次，109 次变化 / 9.6 s，并提示 FlatList 无 `getItemLayout`。0.12.1 时“窗口边缘一行反复增删”的推断由此确认。5 + 1 + 5 + 1 次中出现 2 次（0.12.1 正式版、0.13.0 诊断版），是 app 侧可复现的偶发行为，按现状记录（不改 app）。
- **S22 iOS 正式版第 4 轮失败（0.13.0）**：还没到通知——`login()` 输入密码时 `App did not become idle within the 10000ms timeout. Busy: native: keyboard moving`。截图中键盘已完全显示。设备日志：`willShow` 00:30:34.538，键盘显示过程中 UIKit 读取剪贴板（`Retrieving local-only general pasteboard` 00:30:34.620 → 完成 00:30:44.891，10.27 s），完成后 0.05 s 才发出 `didShow`（00:30:44.942）。Quiesco 的 `KeyboardMotion`（`@quiesco/native`，0.12.1 起未改）在 `willShow` 与 `didShow` 之间报 `moving`，按字面是对的；原因是 iOS 系统侧一次卡顿。改进余地：通知里带有动画时长（0.38 s），可设上限；或在报错中说明“收到 willShow 后 10 s 没有 didShow” → 提交 h2nology/quiesco#104。
- **Android 模拟器进程退出（0.13.0 运行中）**：第一次 Android 正式版第 2 轮 S7a 中，模拟器进程在 00:47 消失，设备日志在此之前正常，无崩溃报告、无睡眠事件、无内存 / 磁盘不足。与工具的关系不明，不计入结果（冷启动后重跑）。`reboot-android.sh` 的 `adb wait-for-device` 没有超时，脚本停了约 3 小时 → M4 harness 需给重启加超时并检查模拟器进程。
- **S6 Android 正式版第 5 轮失败（0.12.1）**：`scrollTo` 第 21 步拖动后 30 s 内不空闲（SYNC_TIMEOUT）。第 1–20 步每步 0.52–0.66 s，第 21 步的拖动本身正常；之后一直是 FlatList 的 50 ms 批处理定时器 + React 提交 + 元素树每隔一帧变化（最后一次变化 268 → 269 行，超时后抓的树又是 268 行）。已渲染的行已经填满 FlatList 为该滚动位置计算的窗口，两端离行边界只有 2–4 px，行高 51 / 52 交替（app 未设 `getItemLayout`）→ 推测是窗口边缘的一行反复增删（VirtualizedList 每次行布局变化都重新计算窗口），不是追赶渲染，也没有宿主机负载的迹象（约 29 fps 为该模拟器的正常值，日志无 GC / 掉帧）。0.12.1 没有改 Android 代码，判断为 app（FlatList）侧的偶发行为，Quiesco 如实报告了忙碌（插件 `failure-investigator` 读证据，执行者核对；只有最后一帧的证据，“反复增删”是推断，置信度中等）。其他工具不等空闲，不会在这里卡住。按现状记录（不改 app）。证据看不出反复增删、报错也没有指向原因 → 提交 h2nology/quiesco#102（改进诊断），0.13.0 中实现（见上）。
- **S6 Android**：耗时对宿主机负载敏感（35–165 s），正式版保留 300 s 单测超时（W3）。M4 的测量需固定宿主机条件（负载、防睡眠）。
- **宿主机睡眠**：无人值守运行时 macOS 会在 DarkWake 中被强制睡眠，必须用 `caffeinate -dimsu` 包住运行（M4 harness 需内置）。

0.12.0 的 S22 iOS 诊断版失败（#100）在 0.12.1 修复。0.11.0 时列出的问题在 0.12.0 中都已解决（findings.md 0.12.0）：C1 iOS（#92）、对话框 +2 s（#93）、tracker 默认关闭（#94）、`init --upgrade` 改写版本与脚本（#95）、`doctor` 的 app IDs warning（#96）。

## 5. 出处

- 插件内的官方文档副本：`~/.claude/plugins/cache/h2nology/quiesco/0.13.3/skills/*/references/*.md`（2026-11-23）；0.8.0–0.13.3 release notes
- 工具缺陷的根因：`@quiesco/agent` / `@quiesco/core` / `@quiesco/native` 0.8.0–0.13.3 的源码，见 findings.md（由插件的 `failure-investigator` 读证据与源码，并经执行者核对）
- 其余结论均为本仓库实测，测试代码见 `e2e/final`、`e2e/capability`
