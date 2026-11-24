# Task Plan: rn-e2e-shootout（Quiesco / Detox / Appium / Maestro 对比）

规范文档：`e2e-comparison-plan.md`（以下简称“计划书”）。本文件只跟踪执行进度，内容以计划书为准。

## Goal

按计划书完成 M1–M10，产出公开仓库、原始数据、`results/summary.json`、官网对比页素材和发布文。

## Next Step

M4 完成（METHODOLOGY v15，tag `methodology-v15`）：harness、计时标记、固定顺序、环境检查、冒烟问题修复、iOS / Android 差距的按环节拆解、共同场景集的整套耗时。下一步 M5 正式测量（规模按 METHODOLOGY 6.2 预先登记：预热 3、无施压 N = 100、每种施压条件 N = 50），先与用户确定执行顺序与时间安排后 `harness plan` + `execute`。

## Current Phase

Phase 5（M5）：待与用户确定执行顺序（规模按 METHODOLOGY 6.2）

## Phases

### Phase 1: M1 仓库骨架与预注册文档

- [x] `git init`，建立计划书第 1 节的目录骨架
- [x] README.md（目的、立场披露、复现方法占位、结果摘要占位）
- [x] scenarios.md（S1–S23 + C1–C11，含前置条件 / 步骤 / 验证点 / 通过标准、平台适用性表）
- [x] METHODOLOGY.md（指标定义、等待分类 W1–W3、重置规则、N、预热、交错执行、Wilson 区间、施压条件、版本记录）
- [x] 用户审阅并确认 → 提交并打 tag `methodology-v1`
- **Status:** complete

### Phase 2: M2 被测 app + mock server

- [x] `create-expo-app`（SDK 58），Expo Router + New Architecture，scheme `rnshootout`
- [x] 实现 A1–A28，所有元素带稳定 `testID`（A24 的刻意例外除外）
- [x] mock-server：`/reset`、CRUD、延迟、错误注入、轮询 + WebSocket、OAuth 页、延迟图片、推送辅助脚本
- [x] 动画时长可配置（jitter），Toast 固定 2 秒
- [x] iOS 模拟器、Android 模拟器、Web 三端手动走通（Release 构建；未走查项见 progress.md，M3 首次实现时验证）
- **Status:** complete

### Phase 3: M3 四套测试实现（诊断版 + 正式版）

- [x] 先补验 M2 未走查的交互（iOS / Android 均通过；S7b、C1 Android、C11 Android 依赖工具能力，留到各工具实现时验证；发现并修复 3 处 app 问题，见 findings.md）

- [x] detox（Jest），记录易用性数据（结果见 `suites/detox/RESULTS.md`）；SDK 58 不在 Detox 官方支持范围内，按社区 `expo-detox-config-plugin`（≥13.1.0）+ Android ProGuard keep 规则接入，额外配置计入易用性；跑不通记 ✗ 并附来源
- [x] appium（WebdriverIO），记录易用性数据（结果见 `suites/appium/RESULTS.md`）；app 零改动，重置全部用 Appium API
- [x] maestro（YAML），记录易用性数据（结果见 `suites/maestro/RESULTS.md`）；app 零改动；iOS 重置与工具缺失的系统操作经 `scripts/device-helper.mjs`（本地 HTTP）执行外部命令
- [x] quiesco（0.13.3 + Vitest，METHODOLOGY v13；用 quiesco@h2nology 插件接入），记录易用性数据（结果见 `suites/quiesco/RESULTS.md`）。0.11.0 修复 S22 iOS（#82）；开启 `native-module` tracker（用户决定，S18 / #67）后两平台 5 × 24/24；0.12.0 tracker 默认开启、C1 iOS 修复（#92），两平台 5 × 24/24
- [x] 每套正式版 iOS / Android 连续 5 次全绿，或记录 ✗ 原因；C1–C11 逐项检查
- **Status:** complete

### Phase 4: M4 harness 与汇总脚本

- [x] `harness run --tool --platform --runs --variant --stress`（`harness/`，Node 24、无依赖；另有 plan / execute / build / summarize）
- [x] 每次运行输出计划书第 5 节格式的 JSON（+ totalMs、exitCode、timedOut、invalid、sleepEvents、environment）
- [x] 预热、交错执行（固定种子，run-order.json，可断点续跑）、caffeinate、电源 / Spotlight 检查、负载阈值（开机前后各一次）、模拟器开机上限、睡眠事件 → invalid
- [x] 计时标记（mock server `/harness/mark`；四套测试的全局 hook），套件内固定场景顺序（四个工具）
- [x] 汇总：median / p90 / min / max、Wilson 95% 区间（整套 + 按场景）、SVG 图表（results/charts）
- [x] 四个工具 × 两平台经 harness 跑通并生成 summary（冒烟，`results/smoke/`）：Quiesco iOS 24/24、Android 23/24（S6 FlatList）；Detox iOS 22 + 跳过 1 + S21 ✗（同 M3）、Android 22 + 跳过 2（同 M3）；Appium iOS 24/24、Android 23/24（S21 偶发）；Maestro iOS 21/24（S3 / S20 hideKeyboard、S22，M5 前另查）、Android 24/24。修复：Android 模拟器 headless（带窗口被 macOS 限速）、iOS 当前键盘恢复英文、harness 统一 `adb reverse`、Detox 测试名读取
- [x] METHODOLOGY v14（6.3 / 6.4 / 7 / 9 / 2.2 app getItemLayout / Quiesco 0.13.4）用户确认，tag `methodology-v14`（2026-11-24）
- [x] 冒烟中发现的问题修复（2026-11-24）：Quiesco iOS S22 通知权限（#113 → 0.13.4）；Maestro iOS S3 / S20（按回车收起键盘）、S22（场景内点 Allow，限制）；Appium Android S21（登录后等 Home，W3 #15）；harness 检查管理之外的 Android 模拟器。冒烟：Quiesco、Maestro、Appium iOS 24/24（Appium Android S21 单独 5/5）
- [x] 两平台整轮 timeline，按环节解释 iOS 比 Android 慢的原因（findings.md 2026-11-24）
- [x] 整套耗时的口径：用户选“共同场景集”（2026-11-24）→ harness `commonSuiteMs` 实现；METHODOLOGY v15 草稿
- [x] METHODOLOGY v15 用户确认，tag `methodology-v15`（2026-11-24）
- **Status:** complete

### Phase 5: M5 本地正式测量

- [ ] 速度：N ≥ 20 × 工具 × 平台
- [ ] 稳定性：N = 100，诊断版 + 正式版
- [ ] 施压：slow-net / slow-cpu / jitter
- **Status:** pending

### Phase 6: M6 Expo 版本矩阵

- [ ] SDK 54–58（以执行时最新版为准向前 4–5 个）× 四工具，跑 S1
- [ ] 标注 Expo Go / dev client / prebuild / EAS Build / New Architecture
- **Status:** pending

### Phase 7: M7 AI 编写效率

- [ ] 固定模型、提示词；每工具 3 次，记录轮数与通过数，公开对话记录
- **Status:** pending

### Phase 8: M8 外部 review

- [ ] 请各工具使用者 review 实现；如有不公平之处，修正并重跑受影响测量
- **Status:** pending

### Phase 9: M9 CI 与定期重跑

- [ ] GitHub Actions 矩阵、月度定时、手动触发、artifact、summary 自动 PR、Renovate
- **Status:** pending

### Phase 10: M10 官网页面与发布文

- [ ] 标题数字、对比表、图表、方法 / 版本 / 硬件 / 立场披露、Quiesco 不占优项
- [ ] 博客 / 发布文
- **Status:** pending

## Key Questions

00. 【已解决】Android 设备改为 API 36 AOSP（C2 用 API 36 google_apis），METHODOLOGY v3（用户同意，2026-11-17）Detox 20.51.4 无法在 Android API 37 运行（`InputManager.getInstance` 已移除），且官方建议 AOSP default 镜像。是否把所有工具的 Android 测量设备换成 Detox 能运行的 API 级别 / 镜像？（方法变更，开 v3）
0. 【待定，不阻塞】iOS 27 模拟器通知权限无法预授权（simctl / Maestro 均失败），若 Detox / Appium 也做不到，S22 前提需改为“允许测试点 Allow”；C1 失败路径需补充“系统提示重试时点取消”。两者一起开 v3，届时征求用户同意。

1. 外部 review（M8）找谁？——需用户提供人选。
2. “首个测试通过所需时间”由谁执行？——需用户确定第三方，否则按计划书披露为作者本人。
3. AI 编写效率使用哪个 LLM 模型 / 版本？——M7 开始前确定。
4. 仓库公开到哪里（GitHub 组织 / 账号）？——M9 前确定。

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Quiesco 版本锁定 0.5.0 | 用户指定；测量期间不升级 |
| Quiesco runner 用 Vitest（`@quiesco/vitest`） | 用户指定 |
| 深链接 scheme 为 `rnshootout` | 用户指定 |
| 被测 app 使用 Expo SDK 58.0.25 | 2026-11-17 npm 上的 latest |
| 只测 SDK 58，不加 SDK 55 对照组（暂定，“先只测”） | 用户决定（2026-11-17）。Detox 官方只支持 RN 0.77–0.84（SDK 58 为 RN 0.88），发布结果时须注明这一点及来源 |
| 不分阶段交付，按 M1–M10 全量执行 | 用户指定 |
| 规划文件放在项目根目录（legacy 模式） | 单一任务，无并行计划 |
| 场景使用固定测试数据、英文界面、`#list-top-title` 判定第一行 | 避免各工具“元素顺序断言”能力差异干扰其他指标 |
| 速度数据复用正式版无施压的 100 次运行 | 避免重复跑；N=100 ≥ 20 |
| 场景耗时取自各工具 JUnit XML，套件耗时由 harness 外部计时 | 四个工具都能输出 JUnit，口径统一 |
| 施压配置由 mock server `/config` 下发 | 所有工具共用一份配置，不在各工具中分别设置 |
| 施压每种 N=50；`slow-cpu` 仅 Android；AI 编写每场景最多 10 轮 | 草案自定，用户审阅未提异议，随 v1 预注册 |
| Android 测量设备改为 API 36 AOSP，C2 在 API 36 google_apis 上检查（METHODOLOGY v3） | Detox 20.51.4 无法在 Android 37 运行，官方建议 AOSP；用户选方案 B 并同意 v3 |
| 公开文档用中文 | 用户指定；用户之后自行翻译 |
| jitter 采用方案 (a)：在 METHODOLOGY 写明覆盖范围，开 v2 | 用户决定（2026-11-17）；同时把 Release 构建、设备环境统一设置写入 v2 |
| M3 接入顺序：Detox → Appium → Maestro → Quiesco | 用户采纳建议：Quiesco 最后，避免熟悉 app 的过程只让 Quiesco 受益。注意：M2 走查已使用过 Maestro，对 Maestro 的熟悉度需在易用性数据中披露 |
| 许可证 MIT（版权人写 “rn-e2e-shootout contributors”） | 用户指定 |
| 计划书与规划文件纳入 Git 并公开 | 用户指定 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `expo run:ios --device <UDID>` 报 `connect ENOENT /var/run/usbmuxd`（枚举物理设备时） | 1 | 改为 `pod install` + `xcodebuild -destination id=<UDID>` + `simctl install` |
| iOS 27：页面内容画在原生标题栏下面（标题栏 y=62–116，内容从 y=0 开始） | 1 | `headerTransparent: false` + `headerStyle.backgroundColor` → 无效 |
| 同上 | 2 | `Screen` 改为 `contentInsetAdjustmentBehavior="automatic"` 的 ScrollView → 无效 |
| 同上 | 3 | 用 `HeaderHeightContext` 在 iOS 上手动加 paddingTop → 截图仍完全相同（连标题栏背景色也没变，怀疑改动未进入 app；入口 bundle 为 lazy，无法直接确认）→ 已达 3 次，上报用户 |
| 同上 | 4（用户同意） | 打 Release 构建：标题栏正常，第 1 次修复（不透明 header）本来就有效；Debug 构建未加载新代码。撤回第 2、3 次改动 |
| iOS：嵌套在 Pressable 里的按钮（`rea-card-action`、`item-delete-*`）不出现在无障碍树中，Maestro 点不到 | 1 | 改为并列结构（卡片标题 / 行主体与按钮为兄弟节点） |
| Detox C1 iOS：`device.unmatchFace()` 在 Face ID 弹窗显示时卡在 waitForActive（5 分钟超时） | 1 | 改用外部 `notifyutil -p com.apple.BiometricKit_Sim.pearl.(no)match`，记为需额外配置 |
| Detox C11 iOS：`system` API 找不到推送横幅 | 1–3 | 截图确认横幅已显示 → 预热 XCUITest runner → 试多种 label，均失败 → 记 ✗ |
| Detox C10：`toHaveText` 对 Pressable（View）不匹配 | 1 | iOS 用 `toHaveLabel`；Android 用 `by.text().withAncestor()` |
| Detox 重置用 `delete: true`（卸载重装），不符合 METHODOLOGY 5 | 1 | 改为外部命令只清数据（iOS 清数据容器 + privacy reset；Android pm clear），重跑 5 轮 |
| 我误记“Detox 文档注明 setOrientation 仅 iOS” | 1 | 核对文档无此说法，改为实测 |
| Appium Android S1：列表不出现 | 1 | app 经 localhost:4000 访问 mock server，Appium 不做 adb reverse → `onPrepare` 执行 `adb reverse` |
| Appium iOS 重置：`mobile: setPermission` 后 WDA 断开（ECONNREFUSED 8100） | 1 | 改用 `mobile: simctl privacy reset all` |
| Appium iOS：邮箱输入丢字符 | 1–4 | sleep 3 s、等键盘、`maxTypingFrequency` 20（冷启动 4/8）、关 keyboardPrediction 均无效 → 先输入首字符并 W3 等值反映（24/24） |
| Appium iOS S22：点通知被识别为横向滑动 | 1 | 右滑卡片露出 “Open” 再点 |
| Appium iOS：系统 UI（分享面板、LocalAuthentication 弹窗）刚出现时点击被忽略 | 1 | W2 点完状态未变则再点 |
| Appium iOS C10：language capability 重启 SpringBoard 使 WDA 断开 | 1 | `mobile: launchApp` 的 `-AppleLanguages` 启动参数 |
| Appium iOS S7b：`configureLocalization` 写入的键盘值格式有误 | 2 | 外部命令 `simctl defaults write -g AppleKeyboards` |
| mock server 进程崩溃（请求途中客户端断开，`aborted` 未捕获） | 1 | handler 包 catch；用中途断开的请求验证后服务仍正常 |
| Maestro Android：启动中的点击使之后所有注入触摸失效（`pointers already down for device -1`） | 3 | 起初误判为 launcher 问题；logcat 查明根因，正式版重置后加 `waitForAnimationToEnd`（W3） |
| 等待循环 `pgrep -f "maestro.*test"` 匹配到自身命令行，永远不结束 | 1 | 改为检查后台任务输出文件 |
| Maestro `swipe` 的 `start` / `end` 不能用环境变量（Parsing Failed） | 1 | 按平台分支写死坐标 |

## Notes

- 计划书是规范；若执行中需要改方法，先改计划书 / METHODOLOGY 并升版本号。
- `methodology-v1` tag 打之前不跑任何正式测量。
