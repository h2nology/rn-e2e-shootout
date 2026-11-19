# Quiesco：接入结果（M3）

- 版本：quiesco / @quiesco/* 0.7.0（METHODOLOGY v4，计划制定时为 0.5.0），Vitest 5.1.1
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，`E2E_TOOL=quiesco EXPO_PUBLIC_QUIESCO=1`（`build.sh`）
- **对 app 的改动**：`@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin` 依赖；`app.json` 的 config plugin；`metro.config.js`（`withQuiesco()`）；`index.ts` 入口（第一行 import agent）；根布局包 `<QuiescoRoot>`；仅 Quiesco 构建：iOS `CFBundleLocalizations`（C10）。非 e2e 构建中 plugin 把 native 模块排除出自动链接、metro 把 agent 换成空实现
- 重置：见 METHODOLOGY 5 的表（Quiesco 默认的 soft reset 粒度不同，另外用 `relaunch({ clearData: true })` 补齐）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)
- **披露**：接入使用了 Quiesco 官方的 Claude Code 插件（METHODOLOGY v4）；执行者代表 Quiesco 作者一方

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Quiesco API 以外的外部命令或对 app 的额外改动；需额外说明 = 用了与场景描述不同的方式。

## 1. 场景 S1–S23（正式版）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `type()` 一次写入整段文字（iOS `insertText`、Android `commitText`），不满足“逐字输入” → 每个字符调用一次 `type()`（需额外说明） |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | iOS：`scrollTo`（`timeoutMs` 300 s，W3），约 90–120 s。Android：`scrollTo` 因工具缺陷不可用（带 RefreshControl 的列表，WAITS #2）→ 手写 `scroll()` 循环，约 65 s；单测超时放宽到 300 s（W3）。另有“目标只露出细边就停下、点击落在列表外”的工具缺陷，补一次拖动（W2，因 iOS 失败而加，两平台都执行）。`scrollToIndex` 是 app 内部方法，场景禁止 |
| S7a 中日文（文本 API） | ✓ | ✓ | `type()` |
| S7b 中日文（经由输入法） | ✗ | ✗ | iOS：`type()` 不经过输入法；软键盘在其他进程，`system.*` 看不到按键（实测 “outside the app: nothing”），模拟器也没有外部点击命令（Appium / Maestro 经 XCUITest 能点键帽）。Android：AOSP 镜像没有中日文输入法（与工具无关） |
| S8 原生控件 | 需额外说明 | 需额外配置 | 开关：`tap`；滑块：`adjustSlider`（真实拖动；`setValue` 为直接设值，场景禁止）。日期 iOS：inline 日历的格子不在元素树中，按 `control-date-picker` 内的相对坐标点击（依赖 en_US 的周日开头）。日期 Android：系统日期对话框是 app 的独立窗口，Quiesco 的真实触摸到不了，文档给的方法只有 `setValue`（回调，场景禁止）→ 外部命令 `uiautomator dump` + `adb shell input tap` |
| S9 WebView | ✓ | ✓ | `app.webview()`：按文字 / CSS 选择页面元素，`tap()` 为真实触摸。两平台都不需要等待（Appium、Maestro 在 iOS 上都需要重试） |
| S10a 预先授权 | ✓ | ✓ | `setPermission('location', 'grant')` |
| S10b 点击系统权限弹窗 | ✓ | ✓ | `system.tap({ text: 'Allow While Using App' })` / `system.tap({ id: 'permission_allow_foreground_only_button' })`（也有 `system.allowPermission()`，但按场景须点“使用 app 期间允许”） |
| S11 无限动画 | ✓ | ✓ | 不需要同步绕过 |
| S12 左滑删除 | ✓ | ✓ | `swipe('item-row-1', 'left')` |
| S13 下拉刷新 | ✓ | ✓ | `swipe('item-list', 'down')` |
| S14 长按 / 拖拽 | ✓ | ✓ | `longPress()`、`drag(handle, row)` |
| S15 Reanimated | ✓ | ✓ | 不需要同步绕过 |
| S16 轮询 / WebSocket | ✓ | ✓ | 不需要同步绕过（`setInterval` 与已打开的 WebSocket 默认不计入忙碌） |
| S17 Toast | ✓ | ✓ | |
| S18 错误与重试 | ✓ | ✓ | |
| S19 Tab 状态 | ✓ | ✓ | `goBack()`：iOS 点导航栏返回按钮，Android 返回键 |
| S20 键盘遮挡 | ✓ | ✓ | `dismissKeyboard()` |
| S21 深链接 | 需额外配置 | 需额外配置 | 热启动：`openUrl()` 不能在 app 处于后台时调用（报错要求先 `bringToForeground`），场景要求后台时打开 → 外部命令 `simctl openurl` / `adb shell am start`，再 `bringToForeground()`。冷启动：`terminate()` + `relaunch({ url })`（真正的冷启动） |
| S22 本地通知 | 需额外说明 | ✓ | `sendToBackground()` + `openNotification(title)`（iOS：横幅或通知中心；Android：通知栏）。iOS：通知权限不能预先授予，也不能用 simctl 重置 → 依赖本模拟器已授予的状态。Android：`openNotification` 只找 5 秒，需 W2（WAITS #4）。Appium / Maestro 在 iOS 上要处理的“通知分组”“点击被识别为滑动”在 Quiesco 中不需要处理 |
| S23 前后台 | ✓ | ✓ | `sendToBackground()` / `bringToForeground()` / `terminate()` / `relaunch()`。“后台停留 2 秒”为场景要求的 `setTimeout` |

### 诊断版（不加任何等待）

| 平台 | 结果 | 失败原因 |
|---|---|---|
| iOS | 20 / 24 | 真实失败：S6（`scrollTo` 默认 10 s 超时）。其余 3 项（S8、S21、S22）为写法问题，已在两版同时修正，修正后诊断版通过 |
| Android | 21 / 24 | S6（`scrollTo` 的工具缺陷）、S22（`openNotification` 只找 5 秒）、S8（写法问题，已在两版同时修正） |

### 连续 5 轮（正式版）

2026-11-19 执行，每轮前重启模拟器（METHODOLOGY 6.4）。S10a / S10b 各为一个测试，共 24 个：

| 平台 | 轮次 | 每轮结果 | 每轮耗时（Vitest 报告的 Duration） |
|---|---|---|---|
| iOS | 5 | 24 / 24（全部场景） | 6 分 25 秒 – 6 分 32 秒 |
| Android | 5 | 24 / 24（全部场景） | 4 分 18 秒 – 7 分 25 秒 |

耗时含每个测试前的重置（`relaunch({ clearData: true })`），仅供参考，正式测量由 harness 进行（M4–M5）。Android 的波动主要来自 S6（重启后模拟器较慢时每次滚动 4–5 秒）。

iOS 这 5 轮跑的代码与最终代码只差 S6 的单测超时（WAITS #5，120 s → 300 s，之后因 Android 而加）；放宽超时不会让通过的结果变为失败，因此没有重跑。

达到上表之前的尝试（不计入，但如实记录；METHODOLOGY 6.1 不重试）：

| 尝试 | 结果 | 处理 |
|---|---|---|
| iOS 第 1 次（WAITS #3 之前） | 第 1 轮 24 / 24；第 2、3 轮 23 / 24（S6：点击落在标题栏，见 WAITS #3） | 中止，查明根因（工具缺陷）后加 #3 |
| Android 第 1 次（WAITS #5 之前） | 第 1 轮 23 / 24（S6 超过 120 s 的单测超时），第 2–5 轮 24 / 24 | 加 #5 后用最终代码重跑（即上表） |

## 2. 能力检查 C1–C11

`e2e/capability/`。各项至少 1 次通过；C2 Android、C5、C10 iOS 修正后多次通过。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | ✓ | ✓ | 内置 API：`biometrics.enroll()` / `fail()` / `match()`；失败后的“取消”用 `system.tap`。Android 的 PIN 设置与指纹登记由 Quiesco 自动完成并在测试后撤销（Appium / Maestro 需在设置 app 中手动登记） |
| C2 跨 app 登录 | ✗ | 需额外配置 | iOS：ASWebAuthenticationSession 的确认框（`Continue`）可以点，但其中的网页在其他进程，`system.*` 读不到页面元素，模拟器也没有外部输入命令。Android（GAPIS）：Custom Tab 中的元素可经 `system.tap` 点击，但没有输入文字的 API → `adb shell input text` |
| C3 分享面板 | ✗ | ✓ | iOS：面板在其他进程，`system.*` 看不到，`tapAt` 点面板外区域也不能关闭（触摸注入在 app 窗口内）。Android：`system.expectVisible` 确认面板出现后 `pressBack()` |
| C4 选择器 | ✓ | ✓ | `{ id: 'dup-row', index: 2 }`；`{ label: 'Secret button' }` |
| C5 嵌套滚动 | 需额外说明 | 需额外说明 | 横向轮播上 `scrollTo` 误判“已到两端”（工具缺陷），`scroll()` 的 `distance` 不起作用 → 手写 `scroll()` 循环，第 6 张中心露出后点击 |
| C6 启动阶段 | ✓ | ✓ | 冷启动后直接 `type()`，不需要任何等待 |
| C7 远程图片 | ✓ | ✓ | |
| C8 深色模式 | ✓ | ✓ | `setAppearance()` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation()` |
| C10 系统语言 | 需额外配置 | ✓（需额外说明） | `setLocale()`。iOS：以 `-AppleLanguages` 重新启动，要求 app 声明 `CFBundleLocalizations`（只加在 Quiesco 的构建，用户决定）。Android：per-app language（`cmd locale set-app-locales`），不是改系统语言 |
| C11 远程推送 | ✓ | ✗ | iOS：场景规定的辅助脚本 `push-ios.sh`（`simctl push`，测试中直接调用）+ `openNotification()`。Android：模拟器没有推送服务；Quiesco 的 `sendNotification` 以 app 身份在本地发通知，不经推送库，app 不进入目标页（实测）——与其他工具同为 ✗ |

## 3. 出处

- 插件内的官方文档副本：`~/.claude/plugins/cache/h2nology/quiesco/0.7.0/skills/*/references/*.md`（2026-11-19）
- 工具缺陷的根因：`@quiesco/agent` 0.7.0（`src/runtime.ts` 的 `scrollTo`、`src/actions/js.ts` 的 `findScrollable`、`src/actions/native.ts` / `hit-test.ts`）、`@quiesco/core` 0.7.0（`src/devices/android.ts` 的 `openNotification`）的源码，见 findings.md
- 其余结论均为本仓库实测，测试代码见 `e2e/final`、`e2e/capability`
