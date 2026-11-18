# Maestro 接入记录

> 易用性数据（METHODOLOGY 10.3）。执行者：Claude（AI 助手），代表 Quiesco 作者一方执行；对 app 已经熟悉（M2 由同一执行者实现），此前已接入过 Detox、Appium，并在 M2 走查中用过 Maestro 临时 flow，因此“首个测试通过时间”仅供参考（METHODOLOGY 10.2）。

## 依据的文档（2026-11-18 访问）

- 安装：https://docs.maestro.dev/getting-started/installing-maestro （本机已在 M2 前安装 CLI 2.11.0，未重新安装）
- 命令参考：https://docs.maestro.dev/reference/commands-available （`launchApp`、`clearState`、`swipe`、`tapOn`、`scrollUntilVisible`、`pressKey`、`back`、`hideKeyboard`、`inputText`、`openLink`、`setPermissions` 等各页）
- 权限：`launchApp` 默认授予全部权限（“By default, Maestro grants all permissions”）
- JavaScript / HTTP：`runScript`、`http.post(url, { headers, body })`、`maestro.platform`
- Hooks：`onFlowStart` / `onFlowComplete`
- 报告：`maestro test --format junit --output <file>`
- 自动重试：只有 Maestro Cloud 有（“Automatic Retries”）；本地 `maestro test` 不重试。flow 中也不使用 `retry` 命令

## 版本

| 项目 | 版本 |
|---|---|
| Maestro CLI | 2.11.0 |
| Java | OpenJDK 17.0.20.1（Homebrew） |

## 步骤

| # | 时间 | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|---|
| 1 | — | 构建：与 Appium 相同的 `E2E_TOOL=none` Release 构建（`build.sh` 与 Appium 的相同，只改输出目录）。本次直接复制 `suites/appium/build/` 的产物（同一份源码、同一配置） | 命令 | **Maestro 不需要改 app**（无插件、无原生代码、无 app 代码改动） |
| 2 | — | 建 `flows/{common,diagnostic,final,capability}`、`run.sh`、`.gitignore` | 手动编辑 | Maestro 没有项目初始化命令，也不需要 `package.json` |
| 3 | — | 状态重置方式调查 | 坑 | 官方文档：`clearState` 在 **iOS 上会重装整个 app**（Android 为 `pm clear`）。METHODOLOGY 5 要求“不重新安装” → iOS 需外部命令补齐 |
| 4 | — | 写 `scripts/device-helper.mjs`（本地 HTTP 小服务，代为执行 `simctl`）与 `flows/common/reset.yaml`（`onFlowStart` 调用） | 手动编辑 | flow 内不能执行 shell 命令（`runScript` 是沙箱 JS，只能发 HTTP），外部命令只能经 HTTP 间接调用 |
| 5 | — | `launchApp` 显式 `permissions: { all: unset }` | 手动编辑 | `launchApp` 默认授予全部权限，会让 S10b 的系统弹窗不出现，也与“清除数据后的初始状态”不一致 |
| 6 | 19 s | iOS S1 首次运行 | 命令 | 失败，报告只有 `Unknown error`；`maestro.log` 里才有原因：`http.post` 没有 body 时报 `method POST must have a request body` → 加 `{ body: '' }` |
| 7 | 14 s | iOS S1 再跑 | 命令 | **首个测试通过（iOS）**，16:31（从 16:25 开始接入约 6 分钟；不含构建，构建复用 Appium 的产物） |
| 8 | — | Android S1：邮箱、密码都输入进了邮箱框 / 什么都没输入；之后所有场景都失败，`adb shell input tap` 也无效，重启模拟器后恢复 | 坑 | 起初误判为模拟器 / launcher 状态异常，花了约 2 小时才查明：Maestro 在 app 窗口尚不能接收输入时就点击，注入的 DOWN 被丢弃但仍被记为按下，之后所有注入的点击都被拒绝（logcat `Invalid DOWN event - pointers already down for device -1`）。正式版在重置后加 `waitForAnimationToEnd`（WAITS.md #1）。Maestro 的报错只有 “Element not found” / “Assertion is false”，从报错和截图看不出原因 |
| 9 | 21 s | Android S1 | 命令 | **首个测试通过（Android）**，16:39 |
| 10 | — | S8 滑块、S14 拖拽的坐标 | 坑 | `swipe` 的 `from` + `direction` 终点固定为屏幕边缘 10% / 90%；`start` / `end` 只能写屏幕坐标，且**不能用环境变量**（解析阶段校验格式，报 `Parsing Failed`）→ 按平台写死屏幕百分比坐标（用 `maestro hierarchy` 读控件 bounds 后换算） |
| 11 | — | S10a iOS：`setPermissions: { location: allow }` 报 `wrong argument value 'allow' was provided for 'location' permission` | 坑 | iOS 定位权限取值为 `inuse` / `always` / `never`，按平台分支 |
| 12 | — | S22 iOS：通知分组展开按钮的 label 实为 `Confirm Show less`，Maestro 文字选择器是整串正则 → `.*Show less` | 坑 | 点通知卡片被识别为横向滑动（与 Appium 相同），改为右滑卡片后点 `Open` |
| 13 | — | S23：场景要求“在后台等 2 秒”，Maestro 没有固定时长等待命令 | 坑 | 由 device-helper 的 `/sleep` 实现（场景要求的停留，不计入等待数） |
| 14 | — | S9 iOS：先按 Maestro 文档的“幽灵点击”对策用 `retryTapIfNoChange`，5 轮中仍失败 1 次（WebView 内容仍在变化，被判为“已变化”不重试） | 坑 | 改为 `repeat while notVisible` 手写重试（W2） |
| 15 | — | iOS 5 轮中 1 轮：Maestro iOS 驱动截图超时，XCTest runner 重启后 Maestro 不恢复会话，其余 23 个 flow 全部失败 | 坑 | 原因不明，未再出现；如实记入 RESULTS |
| 16 | — | 报错可读性：flow 内脚本出错时 JUnit 只有 `Unknown error`；触摸失效时只有 “Element not found”。原因要看 `--test-output-dir` 下的 `maestro.log` 或 logcat | 观察 | 留给 METHODOLOGY 10.3 的报错可读性比较 |

## 状态重置（METHODOLOGY 5）

| 平台 | 做法 |
|---|---|
| iOS | `runScript` → device-helper：`simctl terminate` → 清空数据容器（`get_app_container … data` 下的 Library / Documents / tmp）→ `simctl privacy reset all` → `launchApp`（`stopApp` 默认 true，冷启动；`permissions: { all: unset }`） |
| Android | Maestro 官方：`launchApp: { clearState: true, permissions: { all: unset } }`（`clearState` = `pm clear`） |

两个平台都先由 `runScript` 调用 mock server 的 `POST /reset`。整个重置写在 `flows/common/reset.yaml`，由每个 flow 的 `onFlowStart` 调用。

## 外部命令 / 额外配置一览

| 用途 | 做法 | 原因 |
|---|---|---|
| iOS 清除 app 数据 | device-helper（`simctl`） | `clearState` 在 iOS 上重装 app |
| Android 访问 mock server | `run.sh` 中 `adb reverse tcp:4000 tcp:4000` | Maestro 不做端口转发 |
| 安装 app | `run.sh` 中 `simctl install` / `adb install -r` | Maestro 不负责安装 |
| 固定时长停留（S23） | device-helper `/sleep` | Maestro 没有对应命令 |
| 生物识别（C1） | device-helper：iOS `simctl spawn … notifyutil`；Android `adb emu finger touch`（另需 PIN + 指纹登记） | Maestro 没有生物识别命令 |
| 系统语言（C10 Android） | `scripts/c10-android.sh`：flow 外 `setprop persist.sys.locale` + 重启 zygote | `maestro test` 不能设置语言（只有 `start-device --device-locale`）；重启 zygote 会中断 Maestro 的驱动，只能在 flow 外做 |
| 远程推送（C11 iOS） | device-helper → mock server 的 `push-ios.sh` | 场景规定用辅助脚本 |
| 输入法键盘（S7b iOS） | device-helper：`simctl … defaults write -g AppleKeyboards` | 模拟器默认只有英文键盘 |
| 每轮前重启模拟器 | `scripts/reboot-ios.sh` / `reboot-android.sh`，`scripts/five-runs.sh` | METHODOLOGY 6.4 |
