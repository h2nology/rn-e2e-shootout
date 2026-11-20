# Quiesco 接入记录

> 易用性数据（METHODOLOGY 10.3）。下面的“步骤”是 0.7.0 的首次接入记录；同日升级到 0.8.0 的过程见“升级到 0.8.0”一节（结果以 0.8.0 为准）。执行者：Claude（AI 助手），代表 Quiesco 作者一方执行；对 app 已经熟悉（M2 由同一执行者实现），且此前已接入过 Detox、Appium、Maestro，因此“首个测试通过时间”仅供参考（METHODOLOGY 10.2）。
>
> **额外披露（METHODOLOGY v4）**：本工具的接入使用了 Quiesco 官方的 Claude Code 插件 `quiesco@h2nology`（首次接入 0.7.0，升级后 0.8.0；`setup`、`writing-tests`、`quiesco-api`、`debug` 技能及 `failure-investigator` agent，内含官方文档的副本与操作流程）。其他三个工具没有对应插件，接入时只依据官方网站文档。插件带来的便利会体现在接入步骤、首个测试通过时间和排错过程中，比较时须考虑这一点。

## 依据的文档（2026-11-19 访问）

- 插件内的官方文档副本（与 Quiesco 文档站同源，由 `docs/*.mdx` 生成）：`setup/references/{quickstart,native,cli}.md`、`quiesco-api/references/{api,sync,platforms,runners,parallel}.md`、`debug/references/troubleshooting.md`
- npm：`quiesco` 0.7.0（2026-11-19 上午的最新版）、0.8.0（同日 11:41 UTC 发布）
- 0.8.0 的 release notes（GitHub `h2nology/quiesco` v0.8.0）与插件 0.8.0 中更新的 `api.md`、`platforms.md`、`runners.md`、`cli.md`

## 版本

| 包 | 版本 |
|---|---|
| quiesco（CLI）、@quiesco/core、@quiesco/vitest | 0.8.0（`suites/quiesco`；首次接入时 0.7.0） |
| @quiesco/agent、@quiesco/native、@quiesco/expo-plugin | 0.8.0（`app`；首次接入时 0.7.0） |
| vitest | 5.1.1 |

## 步骤

| # | 时间 | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|---|
| 1 | — | `/plugin install quiesco@h2nology`，按插件 `setup` 技能的流程进行 | 命令 | 技能先检查 Node ≥ 24、Expo SDK 58，再执行 `init` |
| 2 | 13 s | `npx quiesco@0.7.0 init --platforms ios,android --runner vitest`（app 目录，09:15 开始） | 命令 | 安装 6 个包；`app.json` 加 `@quiesco/expo-plugin`；新建 `metro.config.js`（`withQuiesco()`）、`index.ts`（第一行 import agent）并把 `main` 改为 `index.ts`；生成 `quiesco.config.mts`、`vitest.config.mts`、`e2e/app.test.ts`、`e2e:*` 脚本。列出剩余两项：包 `<QuiescoRoot>`、首页 testID |
| 3 | — | 调查 app 侧改动对其他工具的影响 | 调查 | `@quiesco/expo-plugin` 在非 e2e 构建（prebuild 时无 `EXPO_PUBLIC_QUIESCO=1`）中把 `@quiesco/native` 排除出自动链接；`withQuiesco()` 把 agent 换成空实现。因此插件必须一直留在 `app.json`（拿掉反而会让 native 模块链接进其他工具的构建）。`app.config.ts` 的 `quiesco` 叠加为空，开关是 `EXPO_PUBLIC_QUIESCO=1`。**实测**：`E2E_TOOL=none` 的 prebuild 生成 `use_expo_modules!(exclude: ['@quiesco/native'])`（Podfile）与 `expoAutolinking.exclude = ["@quiesco/native"]`（settings.gradle）；e2e 构建的 Podfile.lock 中有 `QuiescoNative` |
| 4 | — | 把测试侧文件（`quiesco.config.mts`、`vitest.config.mts`、`e2e/`）和 runner 依赖（`quiesco`、`@quiesco/core`、`@quiesco/vitest`、`vitest`）移到 `suites/quiesco`；app 只保留 `@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin`（固定为 0.7.0），删除 `e2e:*` 脚本 | 手动编辑 | 本仓库的布局要求（各工具的测试在 `suites/<tool>`）；`init` 默认把测试放在 app 内 |
| 5 | — | `src/app/_layout.tsx` 用 `<QuiescoRoot>` 包住根布局 | 手动编辑（app 代码） | init 列出的剩余项。首页 testID 不需要（所有 testID 已在 M2 实现） |
| 6 | 约 7 min | `./build.sh ios` / `android`（并行；`E2E_TOOL=quiesco EXPO_PUBLIC_QUIESCO=1` + prebuild + Release 构建） | 命令 | 成功。官方的 `quiesco build` 在 app 目录内运行、读取那里的 `quiesco.config`；本仓库的测试工程在 `suites/quiesco`，因此与其他工具一样用脚本构建（Release：`binaryPath` 指向 Release 产物，不用 dev client / Metro） |
| 7 | — | `npx quiesco doctor` | 命令 | 在 `suites/quiesco` 中运行时，app 侧的检查（Expo、agent、metro、入口、`<QuiescoRoot>`、app IDs）全部判为失败；在 `app` 中运行时 app 侧全部通过，但找不到 config 和 runner 包。**doctor 不支持 app 与测试工程分开的布局**（没有指定 app 目录的选项）；两处合起来所有检查都满足 |
| 8 | 21 s | iOS S1（正式版写法） | 命令 | **首个测试通过（iOS）**，09:24（从 09:15 开始约 10 分钟，其中构建约 7 分钟） |
| 9 | 10 s | Android S1 | 命令 | **首个测试通过（Android）**，09:25。`reversePorts: [4000]` 由 Quiesco 做 `adb reverse` |
| 10 | — | 重置的写法 | 坑 | `quiesco()` 设置 `isolate: false`（模块在文件之间共享），在共用模块顶层注册的 `beforeEach` 只对第一个文件生效 → 每个文件写 `test.beforeEach(reset)`。`npx quiesco list` 把这行也列成一个测试（静态解析的误判，运行时正常） |
| 11 | — | iOS 诊断版全套 20 / 24（5 分 15 秒） | 命令 | 失败原因见 RESULTS.md；按插件 `debug` 技能的流程（`find-failures.mjs` 汇总证据）定位 |
| 12 | — | S8 iOS：inline 日历在 app 内部，日期格子不在 Quiesco 的元素树中，`system.tap` 只看 app 之外的系统 UI | 坑 | 按 `control-date-picker` 内的相对位置点击（`tap(…, { point })`）。日历的星期排列取决于地区：模拟器的 `AppleLocale` 是不规范的 `US`（周一开头），按 METHODOLOGY 6.4 改为 `en_US` 并重启（对所有工具都适用的环境修正） |
| 13 | — | S21：`openUrl()` 在 app 处于后台时报错（“call app.device.bringToForeground() first”），场景要求后台时打开深链接 | 坑 | 用场景允许的外部命令（`simctl openurl` / `am start`），之后 `bringToForeground()` |
| 14 | — | S22 iOS：通知权限无法预先授予（simctl 不支持；`setPermission('notifications','reset')` 会重装 app） | 坑 | 依赖本模拟器上已授予的状态（不随 app 数据清除）。全新模拟器首次需要手动允许一次 |
| 15 | — | Android 诊断版全套 21 / 24（3 分 39 秒） | 命令 | S6、S8、S22 失败 |
| 16 | — | S8 Android：系统日期对话框是 app 的独立窗口，文档写明只能用 `setValue`（回调；场景禁止） | 坑 | 外部命令 `uiautomator dump` + `adb shell input tap` |
| 17 | 约 2.5 min | S6 Android：`scrollTo` 拖一次就报“已到两端” | 坑（工具缺陷） | 交给插件的 `failure-investigator` agent 读证据与 agent 源码：带 `RefreshControl` 的列表在 Android 上被 `AndroidSwipeRefreshLayout` 包住，偏移测量恒为 0 → 手写滚动循环（W2） |
| 18 | — | S22 Android：`openNotification` 只找 5 秒，通知约 5 秒后才发出 | 坑（工具限制） | 读 `@quiesco/core` 源码确认写死的 5 秒；`system.expectVisible` 等不到（通知不以横幅出现）→ 再试（W2） |
| 19 | 约 1.5 min | iOS 5 轮中 S6 两次失败（点击 `item-row-400` 没生效） | 坑（工具缺陷） | 起初推测为惯性滚动，`failure-investigator` 读证据否定：`scrollTo` 在露出细边时就停、`tap` 瞄准整行中心（落在标题栏），遮挡检查不考虑裁剪 → 补一次拖动 + `ratio: 1` 断言（W2）。5 轮作废，修正后重跑 |
| 20 | — | C10 iOS：`setLocale` 报 “does it support ja-JP?” | 坑 | 需要 Info.plist 声明 `CFBundleLocalizations`。用户决定只加在 Quiesco 的构建（`app.config.ts` 的 `quiesco` 叠加），重新构建 iOS |
| 21 | — | C2 / C3 / S7b iOS：其他进程的 UI（认证网页、分享面板、软键盘）不在 `system.*` 的可见范围内 | 坑（工具限制） | iOS 模拟器没有外部点击 / 输入的命令 → 记 ✗ |

## 升级到 0.8.0（2026-11-19）

0.7.0 接入中发现的问题提交为 h2nology/quiesco#44–#55（见 findings.md），0.8.0 全部关闭（修复或新增 API）。升级后从诊断版起重跑。

| # | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|
| U1 | 用户更新插件（`/plugin`）到 0.8.0 | 命令 | — |
| U2 | `quiesco.config.mts` 加 `appDir: '../../app'`（#54），在 `suites/quiesco` 中运行 `npx quiesco@0.8.0 init --upgrade` | 命令 | app 与测试工程两侧的包都升级到 0.8.0；另外在测试工程的 `package.json` 加了 `e2e:*` 脚本（dev client 用，本仓库只用 Release 构建 → 删除）、`tsconfig.json` 加 `allowImportingTsExtensions`。依赖改为精确版本 `0.8.0` |
| U3 | `npx quiesco doctor`（在 `suites/quiesco` 中） | 命令 | 必需检查全部通过（#54 修复）；警告 1 项：`app.config.ts` 存在时不比对 app ID |
| U4 | 重置 hook 改为 `setupFiles`（`e2e/setup.ts`），删除各文件的 `test.beforeEach(reset)` | 手动编辑 | 0.8.0 文档给出的写法（#55）；`quiesco list` 不再把 hook 列成测试 |
| U5 | 去掉 C10 用的 `CFBundleLocalizations`（`app.config.ts` 的 `quiesco` 叠加改为空） | 手动编辑（app 配置） | #53：`setLocale` 不再要求该声明（只输出警告：`Intl` 与原生字符串保持 bundle 的语言）。C10 iOS 实测通过 → Quiesco 构建与其他工具的构建相同 |
| U6 | 构建：仍用 `build.sh` | 命令 | 0.8.0 的 `quiesco build` 支持 `appDir` 和 Release（按 `binaryPath` 判断），但 prebuild 不加 `--clean`，会受其他工具 prebuild 留下的 `ios/`、`android/` 影响 → 继续用 `--clean` 的脚本 |
| U7 | 测试代码改为 0.8.0 的 API | 手动编辑 | S3 `type(…, { perCharacter: true })`；S6 直接 `scrollTo`；S8 `system.tap({ text: '25' })`（两平台）；S21 后台时 `openUrl()`；S22 去掉重试；C2 `system.type()`；C3 iOS `system.expectVisible` + `system.tapAt`；C5 `scrollTo('carousel', …)`。删除 `support.ts` 中的外部命令辅助函数 |
| U8 | 诊断版：iOS 22 / 24，Android 23 / 24 | 命令 | S6 两平台：`scrollTo` 整个调用 10 s 超时（Android 上误报为 “to both ends”，插件的 `failure-investigator` 读证据确认列表实际滚动了约 150 行、#44 已修复）。S22 iOS：XCUITest runner 在通知中心崩溃一次（单独重跑 3 / 3 通过，见 RESULTS.md） |
| U9 | C3 iOS 第一次失败 | 坑（测试代码） | `system.tapAt` 的点在屏幕上部，iOS 27 不关闭面板（Maestro 实测相同）→ 改为屏幕高度约 45% 处 |
| U10 | 两个平台同时运行时第二个报 `EADDRINUSE` | 坑（操作） | 两个进程都用默认端口 7357（可用 `server.port` 改）。本仓库的测量本来就依次运行，不改配置 |
| U11 | 正式版第 1 次 5 轮：iOS 第 1 轮 S22 失败；Android 第 4 轮 S10b、第 5 轮 S18 失败 | 坑 | 各交给 `failure-investigator` 读证据与源码：S22 iOS = `openNotification` 的计时含 XCUITest runner 启动（14.4 s）；S10b Android = 后台时空闲等待挂起（N4）；S18 Android = 原生模块 Promise 不计入忙碌（N5）。分别加 W3 / X / W3（WAITS #3–#5），两平台都用最终代码重跑 5 轮 |

## 升级到 0.9.0（2026-11-20）

0.8.0 中发现的问题提交为 h2nology/quiesco#63–#68，0.9.0 全部关闭。升级后从诊断版起重跑。

| # | 用时 | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|---|
| V1 | — | 用户更新插件（`/plugin`）到 0.9.0 | 命令 | — |
| V2 | 8.5 s | 在 `suites/quiesco` 中运行 `npx quiesco@0.9.0 init --upgrade` | 命令 | 两侧的包升级到 0.9.0。与 0.8.0 时相同：依赖写成 `^0.9.0`，并加回 `e2e:*` 脚本 → 改回精确版本 `0.9.0`、删除 |
| V3 | iOS 217 s、Android 210 s | 构建改为 `npx quiesco build ios|android --clean`（用户指出 0.9.0 已支持 `--clean`），删除 `build.sh` | 命令 | iOS 的 `binaryPath` 改为 `build/Build/Products/Release-iphonesimulator/rnshootout.app`（configuration 由路径决定）；Android 的 `build/app-release.apk` 含 `release` → `assembleRelease`。Gradle 内存与其他工具相同用 4 GB：`GRADLE_OPTS=-Dorg.gradle.jvmargs=-Xmx4g`（`quiesco build` 没有对应选项）。写成 `package.json` 的 `build:ios` / `build:android` |
| V4 | — | `npx quiesco doctor` | 命令 | 必需检查全部通过；警告 1 项（`app.config.ts` 时不比对 app ID） |
| V5 | — | 正式版去掉 0.8.0 时的等待：S6 `scrollTo` 300 s、S22 30 s、S18 `expectVisible`、S10b `sync: false` | 手动编辑 | 0.8.0 的正式版保存在 `logs/q080-final-backup/`（不入库） |
| V6 | — | 诊断版：iOS 23 / 24、Android 22 / 24 | 命令 | S6 iOS、S22 iOS 通过（#63、#64 修复）。**S12 两平台 app 崩溃**（新问题，读 logcat / iOS crash report 与 agent、Gesture Handler 源码确认，h2nology/quiesco#74）。S6 Android 一步之后空闲超过 10 s（单独 6 次都通过）→ 每步 30 s（W3） |
| V7 | — | 正式版两平台各 5 轮 | 命令 | 每轮 23 / 24，失败只有 S12（#74） |

## 升级到 0.10.0（2026-11-20）

0.9.0 中发现的问题 h2nology/quiesco#74–#78 在 0.10.0 全部关闭。升级后从诊断版起重跑。

| # | 用时 | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|---|
| W1 | — | 用户更新插件（`/plugin`）到 0.10.0 | 命令 | — |
| W2 | 33 s | 在 `suites/quiesco` 中运行 `npx quiesco@0.10.0 init --upgrade` | 命令 | 两侧的包升级到 0.10.0。与之前相同：依赖写成 `^0.10.0`、加回 `e2e:*` 脚本 → 改回精确版本、删除 |
| W3 | — | `npx quiesco doctor` | 命令 | 1 项失败（误报）：scripts 检查把 `E2E_TOOL=quiesco quiesco build ios --clean` 读成命令 `quiesco quiesco`（#83）。其余通过。不改脚本 |
| W4 | iOS 224 s、Android 267 s | `npm run build:ios` / `build:android` | 命令 | 成功。`native-module` tracker 不开启，`metro.config.js` 不需要 0.10.0 新增的 `nativeModules: true` |
| W5 | — | 诊断版：iOS 23 / 24、Android 23 / 24 | 命令 | S12 两平台通过（#74 修复）、`DBG` 输出消失（#75）。S22 iOS：模拟器的通知设置此前被用户重建，授权丢失 → app 弹出授权弹窗、通知未排程；下一场景开始时 Quiesco 清理残留弹窗点了 “Don't Allow”（#85、#86）。用一次性测试（`setPermission('notifications','reset')` 重装 → `system.allowPermission()`，不入库）恢复为“已授权”，iOS 诊断版重跑 24 / 24。S6 Android：超过 Vitest 的 120 s 单测超时（`scrollTo` 未卡住；中断时每一步的记录不写出，#84） |
| W6 | — | 正式版两平台各 5 轮 | 命令 | Android 5 × 24 / 24。iOS 第 1 轮 S22 失败（#82：runner 冷启动 11.8 s 错过横幅，通知中心路径上 “Open” 的点击时机），其余 4 轮 24 / 24。用户决定按现状记录、等修复 |
| W7 | — | 能力检查 | 命令 | Android 同 0.9.0（C2 在 GAPIS 上 ✓）。iOS：C1 整套中失败、单独 2 / 2 通过；S7b 4 次失败（写入 `AppleKeyboards` 后软键盘仍只有英文，模拟器环境，未查明） |
| W8 | — | 提交 h2nology/quiesco#82–#87（用户要求） | — | 见 findings.md 0.10.0 |

## 状态重置（METHODOLOGY 5）

Quiesco 默认在每个测试前做 **soft reset**（app 内清 AsyncStorage、把 Expo Router 的导航恢复到初始状态并重新挂载，不重启进程），粒度与 METHODOLOGY 5 不同。按规则另外补齐，全部用 Quiesco 的 API：

| 平台 | 做法（`e2e/support.ts` 的 `resetApp`） |
|---|---|
| iOS | mock server `POST /reset` → `app.device.setPermission('location', 'reset')`（`simctl privacy reset`；`clearData` 不撤销权限）→ `app.device.relaunch({ clearData: true })`（清空数据容器、删除 UserDefaults，冷启动） |
| Android | mock server `POST /reset` → `app.device.relaunch({ clearData: true })`（`pm clear`，同时撤销运行时权限） |

## 外部命令 / 额外配置一览（0.10.0，与 0.9.0 相同）

| 用途 | 做法 | 原因 |
|---|---|---|
| Release 构建的 Gradle 内存 | `GRADLE_OPTS=-Dorg.gradle.jvmargs=-Xmx4g`（`npm run build:android`） | Expo 生成的默认值 2 GB；其他工具同样用 4 GB（Detox 接入时 R8 OOM 风险） |
| S7b iOS 键盘登记 | `simctl … defaults write -g AppleKeyboards` | 模拟器默认只有英文键盘（场景前置条件） |
| 每轮前重启模拟器 | `../maestro/scripts/reboot-*.sh`，`scripts/five-runs.sh` | METHODOLOGY 6.4 |

0.8.0 时的 `build.sh`（`quiesco build` 的 prebuild 不加 `--clean`）在 0.9.0 中不再需要。
0.7.0 时另有 S21（`simctl openurl` / `am start`）、S8 Android（`uiautomator dump` + `input tap`）、C2 Android（`adb shell input text`）三处外部命令与 C10 iOS 的 `CFBundleLocalizations`，0.8.0 起都不再需要。
