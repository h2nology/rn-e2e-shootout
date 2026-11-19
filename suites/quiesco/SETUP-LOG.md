# Quiesco 接入记录

> 易用性数据（METHODOLOGY 10.3）。执行者：Claude（AI 助手），代表 Quiesco 作者一方执行；对 app 已经熟悉（M2 由同一执行者实现），且此前已接入过 Detox、Appium、Maestro，因此“首个测试通过时间”仅供参考（METHODOLOGY 10.2）。
>
> **额外披露（METHODOLOGY v4）**：本工具的接入使用了 Quiesco 官方的 Claude Code 插件 `quiesco@h2nology` 0.7.0（`setup`、`writing-tests`、`quiesco-api`、`debug` 技能及 `failure-investigator` agent，内含官方文档的副本与操作流程）。其他三个工具没有对应插件，接入时只依据官方网站文档。插件带来的便利会体现在接入步骤、首个测试通过时间和排错过程中，比较时须考虑这一点。

## 依据的文档（2026-11-19 访问）

- 插件内的官方文档副本（与 Quiesco 文档站同源，由 `docs/*.mdx` 生成）：`setup/references/{quickstart,native,cli}.md`、`quiesco-api/references/{api,sync,platforms,runners,parallel}.md`、`debug/references/troubleshooting.md`
- npm：`quiesco` 0.7.0（2026-11-19 时的最新版）

## 版本

| 包 | 版本 |
|---|---|
| quiesco（CLI）、@quiesco/core、@quiesco/vitest | 0.7.0（`suites/quiesco`） |
| @quiesco/agent、@quiesco/native、@quiesco/expo-plugin | 0.7.0（`app`） |
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

## 状态重置（METHODOLOGY 5）

Quiesco 默认在每个测试前做 **soft reset**（app 内清 AsyncStorage、把 Expo Router 的导航恢复到初始状态并重新挂载，不重启进程），粒度与 METHODOLOGY 5 不同。按规则另外补齐，全部用 Quiesco 的 API：

| 平台 | 做法（`e2e/support.ts` 的 `resetApp`） |
|---|---|
| iOS | mock server `POST /reset` → `app.device.setPermission('location', 'reset')`（`simctl privacy reset`；`clearData` 不撤销权限）→ `app.device.relaunch({ clearData: true })`（清空数据容器、删除 UserDefaults，冷启动） |
| Android | mock server `POST /reset` → `app.device.relaunch({ clearData: true })`（`pm clear`，同时撤销运行时权限） |

## 外部命令 / 额外配置一览

| 用途 | 做法 | 原因 |
|---|---|---|
| Release 构建 | `build.sh` | 测试工程不在 app 目录内（见步骤 6） |
| S21 后台时打开深链接 | `simctl openurl` / `adb shell am start` | `openUrl()` 要求 app 在前台 |
| S8 Android 日期对话框 | `uiautomator dump` + `adb shell input tap` | 对话框是 app 的独立窗口，Quiesco 只能 `setValue`（场景禁止） |
| C2 Android 外部页面输入 | `adb shell input text` | `system.*` 没有输入文字的 API |
| C10 iOS | app 侧声明 `CFBundleLocalizations`（仅 Quiesco 构建） | `setLocale` 的前提 |
| S7b iOS 键盘登记 | `simctl … defaults write -g AppleKeyboards` | 模拟器默认只有英文键盘（登记后仍无法操作软键盘，S7b iOS 为 ✗） |
| 每轮前重启模拟器 | `../maestro/scripts/reboot-*.sh`，`scripts/five-runs.sh` | METHODOLOGY 6.4 |
