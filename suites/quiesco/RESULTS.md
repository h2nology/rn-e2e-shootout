# Quiesco：接入结果（M3）

- 版本：quiesco / @quiesco/* **0.12.1**（METHODOLOGY v9；首次接入为 0.7.0，之后 0.8.0、0.9.0、0.10.0、0.11.0、0.12.0、0.12.1），Vitest 5.1.1
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，`npx quiesco build ios|android --clean`（`npm run build:*`；Android 另加 `GRADLE_OPTS=-Dorg.gradle.jvmargs=-Xmx4g`，与其他工具相同）
- **对 app 的改动**：`@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin` 依赖；`app.json` 的 config plugin；`metro.config.js`（`withQuiesco(config, { nativeModules: true })`，0.11.0 起加 `nativeModules`，见下）；`index.ts` 入口（第一行 import agent）；根布局包 `<QuiescoRoot>`。非 e2e 构建中 plugin 把 native 模块排除出自动链接、metro 把 agent 换成空实现。0.7.0 时 C10 需要的 `CFBundleLocalizations` 在 0.8.0 中已去掉
- 同步配置：0.11.0 起开启 Quiesco 的 `native-module` tracker（用户决定，2026-11-20，原因见 S18）。0.11.0 需在 `quiesco.config.mts` 的 `sync.trackers` 中开启；0.12.0 起 app 侧包装了原生模块就默认开启（#94），config 中的设置已删除。阈值与忽略列表用默认值。这是 Quiesco 自己的配置项，不计入 WAITS
- 重置：见 METHODOLOGY 5 的表（Quiesco 默认的 soft reset 粒度不同，另外用 `relaunch({ clearData: true })` 补齐；hook 放在 `setupFiles`）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)；工具问题：见 findings.md（h2nology/quiesco#44–#55 已在 0.8.0 关闭，#63–#68 已在 0.9.0 关闭，#74–#78 已在 0.10.0 关闭，#82–#87 已在 0.11.0 关闭，#92–#96 已在 0.12.0 关闭，#100 已在 0.12.1 关闭）
- **披露**：接入使用了 Quiesco 官方的 Claude Code 插件（METHODOLOGY v4）；执行者代表 Quiesco 作者一方

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Quiesco API 以外的外部命令或对 app 的额外改动；需额外说明 = 用了与场景描述不同的方式。

## 0. 状态：**达到 M3 完成标准**（两平台连续 5 轮全绿）

0.12.1：**iOS 5 × 24 / 24、Android 24、24、24、24、23 / 24**（2026-11-21；第 5 轮 S6，见第 4 节），诊断版两平台 24 / 24，能力检查 iOS 12 / 12、Android 仅 C11 ✗。

0.12.0：两平台 5 × 24 / 24，能力检查 iOS 12 / 12（C1 在整套中通过，#92 修复）。

0.11.0 + `native-module` tracker 时同为两平台 5 × 24 / 24。0.10.0 时 iOS 未通过的 S22（#82）在 0.11.0 修复。tracker 关闭时 Android 第 1 轮 S18 失败 1 次（#67 的已知限制），按用户决定开启 tracker。

## 1. 场景 S1–S23（正式版，0.12.1）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `type(…, { perCharacter: true })` 逐字输入 |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | `scrollTo`（真实拖动直到目标中心露出）。单测超时 300 s（W3）；每一步的空闲等待 30 s（W3）。0.11.0 正式版 iOS 33–60 s、Android 35–165 s；0.12.0 iOS 46–51 s、Android 34–36 s（宿主机负载低）；0.12.1 iOS 约 49 s、Android 35 s × 4 + 第 5 轮失败（第 21 步之后 30 s 不空闲，FlatList 窗口边缘一行反复增删，见第 4 节）。耗时由两件事决定：① 重启后的第一个测试多出 15–20 s 冷启动（Vitest 按上次耗时排序，0.11.0 起 S6 排第一，0.10.0 时由 S22 / S12 承担，整轮耗时不变）；② 宿主机负载（Android 模拟器 CPU 渲染，负载约 5 时约 35 s，负载 10–16 时 90–165 s；tracker 开 / 关对照无差别，见 findings.md 0.11.0）。Detox 约 120 s、Maestro 约 190 s（各自的测量条件）。`scrollToIndex` 是 app 内部方法，场景禁止 |
| S7a 中日文（文本 API） | ✓ | ✓ | `type()` |
| S7b 中日文（经由输入法） | ✓（能力检查） | ✗ | iOS：外部命令登记拼音 / 日文键盘后，按键与候选词经 `system.tap` 点击。0.10.0 中先失败 4 次（模拟器设置被用户重建后，写入 `AppleKeyboards` 不再生效，软键盘只有英文）；用户在模拟器“设置”中手动添加中文拼音 / 日文罗马字键盘后 2 / 2 通过（与 Quiesco 无关，测试代码未改）。Android：AOSP 镜像没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 开关 `tap`；滑块 `adjustSlider`（真实拖动）；日期：两平台都 `system.tap({ text: '25' })`。0.11.0 开启 tracker 后 Android 多约 2 s（日期选择器的原生调用算作忙碌），0.12.0 默认忽略列表含 `RNCDatePicker.open`，恢复到 12.8 s（#93） |
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
| S18 错误与重试 | ✓ | ✓ | 测试代码无等待。**依赖 `native-module` tracker**：登录后 app 在 `await AsyncStorage.setItem` 期间所有默认 tracker 空闲，登录的 `tap` 可能在首页首次 `/items` 前返回，测试注入的一次性 500 被首次请求用掉（#67，tracker 默认关闭、文档写明）。0.11.0 tracker 关闭时 Android 5 轮中 1 次失败（0.8.0 也是 5 轮中 1 次；0.9.0 / 0.10.0 的 5 / 5 是时机上的运气）。开启后两平台 5 / 5；0.12.0（默认开启）两平台 5 / 5。Appium 在同一处需要等待 |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | |
| S21 深链接 | ✓ | ✓ | 热启动：后台时 `openUrl()`；冷启动：`terminate()` + `relaunch({ url })` |
| S22 本地通知 | ✓ | ✓ | `openNotification`，默认超时。0.10.0 时 iOS 5 轮中 1 次失败（#82，通知中心路径上 “Open” 的点击时机），0.11.0 修复后 iOS 5 / 5（且 0.11.0 起 runner 在 `sendToBackground()` 时预先启动），0.12.0 正式版 5 / 5。0.12.0 的 iOS 诊断版失败 1 次（runner 冷启动 12.3 s 错过横幅 + 通知中心里有前一天的同 app 通知堆叠 → 10 s 超时，见第 4 节，#100），重跑通过。0.12.1 修复（#100）后，正式版第 2、3 轮走了通知中心路径（堆叠展开 → “Open”），都通过（34.4 s、27.5 s）。通知权限不能预先授予，依赖本模拟器已授予的状态（见 SETUP-LOG 0.10.0） |
| S23 前后台 | ✓ | ✓ | |

### 诊断版（不加任何等待）

| 平台 | 结果 | 说明 |
|---|---|---|
| iOS | 24 / 24 | 0.12.1：24 / 24。0.12.0：第 1 次 S22 失败（#100），重启后重跑 24 / 24。0.11.0 时 tracker 开启前、开启后各 1 次，都 24 / 24 |
| Android | 24 / 24 | 0.12.1、0.12.0、0.11.0 都 24 / 24 |

0.7.0 时为 iOS 20 / 24、Android 21 / 24；0.8.0 时为 iOS 22 / 24、Android 23 / 24；0.9.0 时为 iOS 23 / 24、Android 22 / 24；0.10.0 时两平台 24 / 24（环境恢复、按规则重启后）；0.11.0 时两平台 24 / 24；0.12.0 时 iOS 23 / 24（S22）、Android 24 / 24。

### 连续 5 轮（正式版，每轮前重启模拟器）

0.12.1（2026-11-21，`scripts/full-check.sh`，`caffeinate` 下运行，区间内无睡眠事件）：

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
- 各场景中位数 0.12.0 与 0.11.0 基本相同（±0.3 s），差别只在 Android S8 / S10b（#93，各 −2 s）。0.12.1 与 0.12.0 基本相同；iOS S23 21.7–26.4 s（0.12.0 21.7–25.5 s），0.12.1 的改动不在其路径上，视为波动。
- iOS 第一次的 5 轮无效：运行中 macOS 进入睡眠（Idle Sleep / Maintenance Sleep / Dark Wake Thermal Emergency），每个失败都与 `pmset -g log` 的一次睡眠逐秒对应（findings.md 0.11.0）。之后用 `caffeinate -dimsu` 包住整个运行重跑，运行区间内无睡眠事件。日志保存在 `logs/q0110nm-final-bad/`（不入库）。
- tracker 关闭时（0.11.0，2026-11-20）：iOS 5 × 24 / 24（335–344 s）；Android 23、24、24、24、24（第 1 轮 S18）。

## 2. 能力检查 C1–C11（0.12.0）

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

| 项 | 0.7.0 | 0.8.0 | 0.9.0 | 0.10.0 | 0.11.0 | 0.12.0 | 0.12.1 |
|---|---|---|---|---|---|---|---|
| 等待（WAITS） | iOS W2×1 / W3×1；Android W2×2 / W3×1 | iOS W3×3；Android W3×3 / X×1 | iOS W3×1；Android W3×2 | 同 0.9.0（代码中 W3×2，两平台都执行） | 同 0.9.0（W3×2）；开启 `native-module` tracker（Quiesco 配置） | 同 0.9.0（W3×2）；tracker 默认开启，无需配置 | 同 0.12.0 |
| 外部命令 / 额外配置 | S8 Android、S21、C2 Android、C10 iOS（app 侧）、构建脚本 | S7b iOS 键盘登记、构建脚本 | S7b iOS 键盘登记、Gradle 内存 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 | 同 0.9.0 |
| 能力检查 | iOS C2 ✗、C3 ✗、S7b ✗ 等 | iOS 全部 ✓；Android C11 ✗ | 同 0.8.0（iOS C1 / C3 偶发失败） | Android 同 0.9.0；iOS C1 整套中失败（单独 ✓）；S7b 在环境恢复后 ✓ | 同 0.10.0（iOS C1 整套中失败，单独 ✓；Android C11 ✗） | **iOS 全部 ✓**（C1 整套中通过）；Android C11 ✗ | 同 0.12.0 |
| 连续 5 轮 | 两平台 5 × 24 / 24 | iOS 3 / 5（S22）、Android 3 / 5（S6） | 两平台 0 / 5（S12 每轮，#74）；其余 23 场景 5 / 5 | iOS 4 / 5（S22，#82）；**Android 5 / 5** | **两平台 5 / 5**（tracker 开启；关闭时 Android 4 / 5，S18） | **两平台 5 / 5** | iOS 5 / 5；Android 4 / 5（S6，FlatList） |

## 4. 未解决的问题

- **S6 Android 正式版第 5 轮失败（0.12.1）**：`scrollTo` 第 21 步拖动后 30 s 内不空闲（SYNC_TIMEOUT）。第 1–20 步每步 0.52–0.66 s，第 21 步的拖动本身正常；之后一直是 FlatList 的 50 ms 批处理定时器 + React 提交 + 元素树每隔一帧变化（最后一次变化 268 → 269 行，超时后抓的树又是 268 行）。已渲染的行已经填满 FlatList 为该滚动位置计算的窗口，两端离行边界只有 2–4 px，行高 51 / 52 交替（app 未设 `getItemLayout`）→ 推测是窗口边缘的一行反复增删（VirtualizedList 每次行布局变化都重新计算窗口），不是追赶渲染，也没有宿主机负载的迹象（约 29 fps 为该模拟器的正常值，日志无 GC / 掉帧）。0.12.1 没有改 Android 代码，判断为 app（FlatList）侧的偶发行为，Quiesco 如实报告了忙碌（插件 `failure-investigator` 读证据，执行者核对；只有最后一帧的证据，“反复增删”是推断，置信度中等）。其他工具不等空闲，不会在这里卡住。可能的处理：app 加 `getItemLayout`（改 app，需所有工具重跑）、或按现状记录。
- **S6 Android**：耗时对宿主机负载敏感（35–165 s），正式版保留 300 s 单测超时（W3）。M4 的测量需固定宿主机条件（负载、防睡眠）。
- **宿主机睡眠**：无人值守运行时 macOS 会在 DarkWake 中被强制睡眠，必须用 `caffeinate -dimsu` 包住运行（M4 harness 需内置）。

0.12.0 的 S22 iOS 诊断版失败（#100）在 0.12.1 修复。0.11.0 时列出的问题在 0.12.0 中都已解决（findings.md 0.12.0）：C1 iOS（#92）、对话框 +2 s（#93）、tracker 默认关闭（#94）、`init --upgrade` 改写版本与脚本（#95）、`doctor` 的 app IDs warning（#96）。

## 5. 出处

- 插件内的官方文档副本：`~/.claude/plugins/cache/h2nology/quiesco/0.12.1/skills/*/references/*.md`（2026-11-21）；0.8.0–0.12.1 release notes
- 工具缺陷的根因：`@quiesco/agent` / `@quiesco/core` 0.8.0–0.12.1 的源码，见 findings.md（由插件的 `failure-investigator` 读证据与源码，并经执行者核对）
- 其余结论均为本仓库实测，测试代码见 `e2e/final`、`e2e/capability`
