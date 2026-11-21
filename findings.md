# Findings & Decisions

## Requirements

- 规范见 `e2e-comparison-plan.md`（M1–M10、S1–S23、C1–C11、A1–A28）。
- Quiesco 0.5.0 + Vitest；scheme `rnshootout`；不分阶段。

## Research Findings

### 宿主机环境（2026-11-17 实测）

| 项目 | 值 |
|---|---|
| 机型 / CPU | Apple M5 Pro，15 核 |
| 内存 | 24 GB |
| macOS | 26.7.2 (25G332) |
| Xcode | 27.2 (27B52) |
| iOS 模拟器 runtime | iOS 26.5、iOS 27.0；设备有 iPhone 17 / 17 Pro Max / Air |
| Android | emulator 37.2.12.0；system image android-37.0 google_apis_playstore；AVD `Medium_Phone_API_37.0` |
| Node / npm / pnpm | v24.22.1 / 11.19.1 / 12.18.0 |
| Java | OpenJDK 17.0.20.1 |
| 已安装 | maestro 2.11.0、applesimutils 0.9.12、adb 1.0.41 |
| 未安装 | appium、detox CLI、watchman、eas-cli |

### npm 最新版本（2026-11-17 查询）

| 包 | 版本 |
|---|---|
| expo | 58.0.25（latest） |
| detox | 20.51.4 |
| appium | 4.0.0 |
| webdriverio | 10.2.0 |
| quiesco | 0.5.0（依赖 `@quiesco/core` 0.5.0，engines node ≥ 24） |

### Quiesco 0.5.0 包构成（npm search 结果）

- `quiesco`：CLI（init / test / ui / list / doctor / tree）
- `@quiesco/core`：host 端（WebSocket server、Driver、device providers），与 runner 无关
- `@quiesco/agent`：app 内 agent（RN / Expo，iOS / Android / Web）
- `@quiesco/native`：原生触摸注入（Expo Module，仅 e2e 构建）
- `@quiesco/expo-plugin`：config plugin，只在 e2e 构建里链接 `@quiesco/native`
- `@quiesco/vitest`：Vitest 集成（每次运行一个 session，`app` 作为 fixture，每个测试前 reset）
- `@quiesco/web`：Web DeviceProvider（基于 Playwright library）
- 另有 `@quiesco/jest`、`@quiesco/cucumber`、`@quiesco/steps`、`@quiesco/ui`、`@quiesco/protocol`

注：`@quiesco/vitest` 自带“每个测试前 reset”，需确认它的 reset 粒度是否与计划书 2.2 的统一重置规则一致（M3 时实测）。

### 版本矩阵范围

- 最新 SDK 为 58，向前 4–5 个版本即 54–58。Quiesco 支持 55+，所以 SDK 54 那一格预期为 ✗。

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| SDK 58 作为主测版本 | 当前 latest |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `xcodebuild -version` 混入 result bundle 日志 | 无害，过滤输出即可 |

## Resources

- 计划书：`e2e-comparison-plan.md`
- https://www.npmjs.com/package/quiesco

### Expo SDK 58 默认模板（`create-expo-app --template default@sdk-58`，2026-11-17）

- react-native 0.88.1、react 19.3.0、expo-router ~58.0.31、react-native-reanimated 4.7.1、react-native-worklets 0.13.0、react-native-gesture-handler ~3.3.0、react-native-screens ~4.30.1、react-native-web ~0.21.4、TypeScript ~6.0.3
- 路由目录是 `src/app/`（不是根目录 `app/`）；模板自带 Tab（`src/components/app-tabs.tsx` / `.web.tsx`）
- `app.json`：`web.output = "server"`、`experiments.reactCompiler = true`、`typedRoutes = true`
- 模板自带 `AGENTS.md`：要求依据 v58 版本文档而不是记忆；安装依赖一律 `npx expo install`
- 模板自带 LICENSE（已删除，以仓库根目录 MIT 为准）

### mock-server

- Android 模拟器没有官方命令可以注入“远程推送”（需要 FCM）；iOS 可用 `xcrun simctl push`。C11 的 Android 侧实现方式待 M3 实测。
- 计划 bundle id / package 统一为 `com.rnshootout.app`（推送脚本依赖它）。

### react-native-gesture-handler 3.3.0（SDK 58 模板自带）

- v3 改为 hooks API：`usePanGesture` / `useLongPressGesture` / `useTapGesture` …，配合 `GestureDetector`；旧的 `Gesture.Pan()` 仍以 `Gesture`（GestureObjects）导出，带 Legacy 前缀的类型为旧 API。
- 回调：`onBegin` / `onActivate` / `onUpdate` / `onDeactivate` / `onFinalize`；配置 `runOnJS: true` 可在 JS 线程执行回调。
- Pan 事件有 `translationX` / `translationY`；LongPress 配置为 `minDuration`。
- `ReanimatedSwipeable` 位于子路径 `react-native-gesture-handler/ReanimatedSwipeable`，有 `renderRightActions(progress, translation, methods)`、`rightThreshold`、`friction`。

### app 依赖（`npx expo install`，2026-11-17）

react-native-webview 14.0.1、expo-notifications ~58.1.9、expo-location ~58.0.22、expo-local-authentication ~58.0.3、expo-localization ~58.0.5、@react-native-async-storage/async-storage 2.2.0、@react-native-community/slider 5.2.1、@react-native-community/datetimepicker 9.2.1

### jitter 的覆盖范围（与 METHODOLOGY v1 8.4 的偏差，需用户确认）

METHODOLOGY v1 写的是“app 内所有动画时长乘以随机系数”。实现时发现以下动画由原生或第三方库控制，app 无法改时长：
- Android 原生 Stack 转场（native-stack 的 `animationDuration` 只对 iOS 生效）
- `ReanimatedSwipeable` 的回弹、`RefreshControl` 的下拉动画、系统日期选择器 / 权限弹窗
已覆盖：iOS Stack 转场、确认 Modal 淡入、Toast 淡入淡出、A11 循环动画、A13 Reanimated 弹簧。
处理方案待定：(a) 在 METHODOLOGY 中写明覆盖范围（开 v2）；(b) 把这些组件换成 app 自绘实现。

### 模拟器环境必须由 harness 统一设置（2026-11-17 在 iPhone 17 / iOS 27 上发现）

- 本机 iOS 模拟器的系统语言为日文：登录按钮显示「ログイン」，不满足 scenarios.md 0.1（en-US）。
- 模拟器开启了“减弱动态效果”（`com.apple.Accessibility ReduceMotionEnabled = 1`）。Reanimated 在此设置下会禁用动画（Metro 日志有警告），会直接影响 S15 和 jitter 的结果。
- 结论：harness 在每次运行前必须显式设置并记录：系统语言 / 地区（en / en_US）、Reduce Motion 关闭、外观（浅色）。Android 同理（语言、动画缩放 `window_animation_scale` 等保持默认 1.0）。这些设置写进 METHODOLOGY（下次开版本时）和结果 JSON。

### iOS 27 上 expo-router Stack 的标题栏默认透明

- 内容从屏幕顶部开始绘制，与标题栏重叠（截图确认）。

### Android 37 模拟器：Debug 构建启动时弹出“附近设备”权限

- 安装 debug APK 后首次启动，系统弹出 “Allow rnshootout to find, connect to, and determine the relative position of nearby devices?”。推测与 Debug 构建通过网络连接 Metro 有关（Android 新版的本地网络权限），Release 构建是否也会出现待确认。
- 模拟器的 `window_animation_scale` 为 1.0（默认）。

### Detox 与 Expo SDK 58 的兼容性（2026-11-17 查询）

- Detox 官方文档（Environment Setup）：支持 RN v0.77.x–v0.84.x。来源：https://wix.github.io/Detox/docs/introduction/environment-setup
- Detox 最新稳定版 20.51.4（2026-06-16）；21.0.0 仅有 rc / alpha。
- 各 SDK 的 RN 版本（npm + expo 仓库 bundledNativeModules.json）：54 → 0.81.5、55 → 0.83.10、56 → 0.85.3、57 → 0.86.3、58 → 0.88.1。Detox 官方范围与 Quiesco（55+）的交集只有 SDK 55。
- 社区插件 `expo-detox-config-plugin` 标注支持 SDK 58，要求 ≥13.1.0；SDK 58（AGP 9）的 R8 会删掉 Detox 需要的 Kotlin 类，Release 构建需加 ProGuard keep 规则。Expo 官方 config-plugins 仓库已移除 Detox 支持。来源：https://github.com/isilher/expo-detox-config-plugin
- 有个例报告 SDK 58 上 Detox 能跑通（需 ProGuard 规则；RN 0.88 下原地 reload 有问题，改为每个测试冷启动）。来源：https://github.com/stefanf81/taskflow-enterprise/pull/184
- 以上均为文档 / 第三方信息，以 M3 实测为准。

### Debug 构建不可靠，走查与测量一律用 Release 构建（2026-11-17）

- iOS Debug 构建 + Metro：三次修改布局后 app 显示完全不变；改用 Release 构建（bundle 内嵌）后立即生效。原因未深究（疑似 Metro 懒加载 / 缓存），结论是 M2 走查和后续测量都只用 Release 构建。
- iOS 26+ 原生标题栏默认透明：`headerTransparent: false` + `headerStyle.backgroundColor` 即可修复（第 1 次修复本来有效）。

### iOS 无障碍树会合并 Pressable 的子元素

- 可点击容器（`Pressable`，accessible=true）内部的按钮不会作为独立元素出现在 iOS 无障碍树中，基于无障碍树的工具（Maestro、Appium XCUITest 等）点不到。app 里所有可点击元素都改为并列结构，避免某个工具因此吃亏。

### 走查观察：Maestro `scrollUntilVisible` 滚到第 400 行很慢（M3 参考）

- 默认参数（speed 40）下 60 秒只滚到约第 150 行。app 端滚动正常。M3 实现 S6 时需按 Maestro 官方推荐写法调参，并计入易用性记录。

### iOS 27：从外部打开深链接会弹系统确认框（影响 S21）

- `xcrun simctl openurl`（Maestro `openLink` 底层同样如此）打开 `rnshootout://...` 时，系统弹出「Open in "rnshootout"?」（Cancel / Open）。S21 的实现必须处理这个系统弹窗；各工具对系统弹窗的处理能力不同，M3 实测时记录各自的做法。

### Android Release 构建不弹“附近设备”权限

- Release APK（bundle 内嵌，不连 Metro）启动时没有“附近设备”弹窗，确认该弹窗只出现在 Debug 构建。测量一律用 Release 构建。
- Android 37 模拟器的系统语言为 en-US（`ro.product.locale`），符合 scenarios.md 0.1。

### Web 走查观察（M3 参考）

- Maestro 2.11 Web（beta）：`tapOn` 密码框后焦点仍留在邮箱框，两段输入都进了邮箱；`pressKey: Tab` 不受支持，flow 中断。Maestro 的 Chrome 继承宿主语言（日文），需要设法固定 en-US。
- harness 在 Web 上也必须固定浏览器语言 / locale（C10 依赖）。

### iOS 27 模拟器：通知权限无法预先授予（影响 S22 前提）

- `xcrun simctl privacy <udid> grant notifications com.rnshootout.app` 报错（NSPOSIXErrorDomain code=1）。
- Maestro `launchApp: { permissions: { notifications: allow } }` 之后，app 申请通知权限时仍弹出系统对话框 → 预先授权未生效。
- app 已改为发送前检查 / 申请权限（与真实 app 一致），因此未预授权时会出现系统权限框，可从画面直接判断。
- Detox（applesimutils）与 Appium 的授权方式待 M3 实测。若所有工具都无法预授权，需要考虑修改 S22 前提（允许测试点击“Allow”），这属于场景语义变更，需开 METHODOLOGY v3 并征得用户同意。

### iOS 系统级交互补验（2026-11-17，Release，iPhone 17 / iOS 27）

- 通过：S23 前后台草稿保持、S14 拖拽（R5 → 顶部）、S8 滑块（须拖动滑钮本身，点轨道无效）与 inline 日期选择器弹出、C2 OAuth（`openAuthSessionAsync`，系统会先弹“wants to use … to Sign In”确认）、C3 分享面板（iOS 27 无 Close 按钮，点面板外关闭）、C9 横竖屏（Maestro `setOrientation`）、C8 深色模式（`simctl ui appearance dark`）、S22 本地通知（点 Allow 后）、C11 远程推送（`simctl push`；通知中心里同一 app 的多条通知会折叠，第一次点击只会展开）。
- C1 生物识别：`notifyutil -s com.apple.BiometricKit.enrollmentChanged 1` 后，`…BiometricKit_Sim.pearl.match` → 显示 Unlocked。`…pearl.nomatch` 后系统提示重试，`authenticateAsync` 不会立即返回失败，需要再点“取消”才显示 Failed。C1 的步骤描述需补充这一点（与 S22 的前提问题一起处理，需开 v3）。

### Android 系统级交互补验（2026-11-17，Release，Medium Phone API 37）

- 通过：S23 前后台草稿保持、S19 硬件返回键（键盘打开时第一次返回只收起键盘）、S14 拖拽、S8 滑块（点击轨道即跳到对应值，与 iOS 不同）与系统日期对话框、C2 OAuth（Custom Tabs）、C3 分享面板（返回键关闭）、C9 横竖屏、C8 深色模式（`adb shell cmd uimode night yes`）、S22 本地通知。
- 模拟器环境：Chrome 首次启动向导会挡住 OAuth（Custom Tabs），且按钮文字每次不同。harness 环境准备需执行：`adb shell 'echo "_ --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'` + `adb shell am set-debug-app --persistent com.android.chrome`。
- React Native 在 Android 上：app 进程刚启动、JS 尚未就绪时送达的深链接（onNewIntent）会丢失。scenarios 中没有该时序（S21 冷启动 = app 未运行，正常；热启动 = app 已在后台运行，正常），不影响场景，但工具实现中“启动后立刻 openLink”会失败。
- 未验证：C1 Android 生物识别（需在模拟器上设置锁屏 PIN 并录入指纹，留到工具实现时验证）、C11 Android 远程推送（无 FCM，预期 ✗）、S7b 输入法（依赖工具能力）。

### app 修复（M3 补验中发现）

1. 发送本地通知前检查 / 申请通知权限（与真实 app 一致；原实现在未授权时静默不发）。
2. 根布局在 splash 期间不再 `return null`，导航器从一开始挂载，Tab 布局等登录态恢复后再渲染（避免 splash 期间深链接丢失）。
3. `/auth`（OAuth 回跳页）在原生端打开后立即返回发起页（Android 上 Expo Router 会把回跳 URL 当作深链接打开该页，盖住结果）。

### Detox（iOS，SDK 58 / RN 0.88）实测（2026-11-17）

- 诊断版（无等待）iOS：S1–S23 中 17 通过 / 5 失败 / 2 跳过（S10b Android、S22）。修正 3 处写法错误后（S6 步长、S8 滑块、S21 热启动 API），剩余失败：S11（无限动画，120 s 超时）、S17（Toast 消失需等待）、S21（见下）。
- S16（轮询 1 s + WebSocket）在诊断版中直接通过：Detox 同步没有被轮询卡住。
- `adjustSliderToPosition(0.75)` 只改原生 UISlider 的值，Fabric 下的 `@react-native-community/slider` 5.2.1 收不到 `onValueChange` → 改用从滑钮开始的 `swipe`。
- 深链接：`device.openURL` 仅用于前台；`launchApp({ newInstance: false/true, url })` 在 RN 0.88（SceneDelegate）下均不生效（app 回到前台但不跳转）。外部 `simctl openurl` 对已运行的 app 有效（热启动可行，但有竞态，需 W3）；外部命令冷启动的进程 Detox 无法连接 → **S21 冷启动在 iOS 上做不到**。RN 0.88 不在 Detox 官方支持范围（RN 0.77–0.84），结果须注明。
- S6 滚动到第 400 行约 120 s（贴近模板默认的 120 s 单测超时）。
- 状态重置用 `launchApp({ delete: true })`（卸载重装），每个场景约多花数秒，反映在 resetMs。
- 正式版 iOS：S11 修正后 21 通过、S21 ✗、S22 跳过（✗）；S10b 因平台判断 bug 被误跳过（`DETOX_CONFIGURATION` 环境变量 Detox 并不设置），已改用 `device.getPlatform()`，待重跑。S11 修正后通过：Detox 处理无限动画须在进入页面**之前** `disableSynchronization()`，且不能在该页面内 `enableSynchronization()`（会等待空闲而卡死，verbose 日志确认卡在 `setSyncSettings {"enabled":true}`，忙碌原因为 Animated 原生驱动的循环定时器）。

### Detox（Android，API 37 google_apis_playstore）实测（2026-11-17）

- `android.emulator` 设备类型：Detox 通过 telnet 查询模拟器控制台时超时（`response not received`）；emulator 37 的控制台需要认证。改用 `android.attached`（adbName `emulator-5554`）可绕过。
- 绕过后 app 启动即崩溃：`java.lang.NoSuchMethodException: android.hardware.input.InputManager.getInstance []`（Detox 的 Android 端通过反射调用该隐藏 API，Android 37 已移除）。→ **Detox 20.51.4 无法在 Android API 37 上运行**，与 app 无关。
- Detox 官方 Android 环境指南（https://wix.github.io/Detox/docs/guide/android-dev-env）：未列出支持的 API 范围（示例为 API 28，称其他 API 也支持）；**强烈建议使用 AOSP `default` 镜像**，不建议 Google APIs 镜像（Play 服务占 CPU）。当前计划使用的是 API 37 `google_apis_playstore`。
- 是否更换 Android 测量设备（API 级别 / 镜像类型）属于方法变更，需用户决定（开 v3）。

### Android 设备更换实测（2026-11-17）

- API 36 AOSP `default`：Detox S1 通过（12 s）；无浏览器（仅 `com.android.webview`、`webview_shell`）；locale en-US。
- API 36 `google_apis`：Detox S1 通过（24 s，首次启动，Play 服务占 CPU）；有 `com.android.chrome`。
- 用户同意：主测量用 API 36 AOSP，C2 在 API 36 google_apis 上检查 → METHODOLOGY v3。
- 需在新设备上重新走查 app（M2 的 Android 走查在 API 37 上进行）。
- Detox Android（API 36 AOSP）：诊断版 15 通过 / 7 失败（S3、S8、S9、S11、S15、S17、S20）；S21 冷 / 热启动均通过（iOS 的 SceneDelegate 问题不影响 Android）。
- Android 专有问题：~~`setOrientation` 文档注明仅 iOS~~（更正：当前文档只写明 iPad 限制，该说法无出处；实测 Android 可用，需 waitFor）；系统日期对话框的日期格子不可匹配，只能坐标点击；`device.tap` 坐标换算不可靠（传 (811,1387) 实际点到 (2249,4120)），改为基于元素的相对坐标；`web(by.id('webview'))` 匹配到 RN 外层容器，需用默认 `web`；`typeText` 后值带尾随空格（`"note "`）；键盘收起后的布局调整不被同步等待（S20 需 W1）；Detox 构建 R8 OOM 需 `-Xmx4g`。
- app 修复：长表单底部加 safe area inset（Android 15+ 强制 edge-to-edge，Submit 被导航栏遮住）。

### Appium（appium 4.0.0 + XCUITest 13.1.1 / UiAutomator2 9.2.1 + WebdriverIO 10.2.0）实测（2026-11-18）

- WDIO 文档写“WebdriverIO 10 requires Appium 3”，但 `@wdio/appium-service` 的 peer 为 `appium >=3`；Appium 4.0.0（2026-11-15 发布）实测可用。
- 官方 Quickstart 只写 `npm install -g appium`；改为 `suites/appium` 本地 devDependencies（官方 managing-exts 指南支持“项目 package.json 声明 appium + 驱动”）以固定版本。
- app 零改动（`E2E_TOOL=none`）。Android 需 `adb reverse tcp:4000`（Appium 无对应 capability，在 `onPrepare` 中执行）。
- 定位：iOS `~testID`（accessibilityIdentifier）；Android testID 是不带包名的 resource-id，`~` 指 content-desc，需用 `UiSelector().resourceId()`。
- 重置：iOS `mobile: clearApp`（仅模拟器）+ `mobile: simctl privacy reset all` + `mobile: launchApp`；Android `mobile: clearApp` + `mobile: activateApp`。全部是 Appium API，不需要外部命令。`mobile: setPermission`（applesimutils）耗时约 10 s 并使 WebDriverAgent 断开（ECONNREFUSED 8100），不可用于重置。
- iOS 输入丢字符：默认输入速度下，冷启动后第一次聚焦邮箱框时丢 1–5 个字符（`us@…`、`ur@…`、`usple.com`），先 sleep 3 s 也会丢。`appium:maxTypingFrequency` 30 仍丢、20 冷启动下 4/8 失败（早先 6/6 是热状态）。最终：先输入第一个字符、W3 等输入框值长度为 1、再输入其余（冷启动 24/24）。Detox `typeText` 未出现此问题。
- UiAutomator2 也有“等待界面空闲”：S11（无限动画）、S16（轮询 + WebSocket）上每个命令都卡住直到 mocha 60 s 超时（socket hang up）。之后同一会话的 UiAutomator2 server 不稳定，下一个 spec 连带失败。
- Appium 不跟踪 app 的网络请求：S23 点保存后立刻 `terminateApp`，POST /items 在途中被切断（mock server 收到 ECONNRESET），服务端没有保存 → 重启后第一行不是 Persisted。正式版等待 `item-row-501`（服务端确认后才由临时行替换）。
- mock server bug：请求途中客户端断开时 `readJson` 抛出 `aborted`，未捕获导致整个进程退出。已修复（handler 包一层 catch，只记日志）。与工具无关，任何工具在同一时机结束 app 都会触发。
- Android 系统 UI：UiAutomator2 能操作权限对话框（AOSP API 36 上按钮文字为全大写 `WHILE USING THE APP`，按 resource-id 定位）和通知栏（`openNotifications()` 后按文字点击）。WebView 内容在原生无障碍树中可见，不切换 WEBVIEW 上下文即可操作（iOS 切换上下文需要 app 开启 `webviewDebuggingEnabled`）。
- iOS 系统 UI（XCUITest）：定位弹窗、通知中心在动画中 / 刚出现时的点击会被忽略（返回成功但无效果），且元素一进入树 displayed / hittable 即为 true，没有可等待的状态。通知中心里已送达的通知不随 `clearApp` 清除，同 app 多条会折叠为组；展开后点击通知被识别为横向滑动（露出 “Open”）而不打开 app → 右滑卡片后点 “Open” 解决。分享面板（出现后约 3 秒内点击无效）、LocalAuthentication 的 Cancel 同样有“刚出现时点击被忽略”，都用 W2 重点。
- iOS WebView：WKWebView 内元素用 `click` 不触发网页 click 事件，`element.tap()`（`mobile: tap`）有效。
- iOS 嵌套 StaticText：RN 的 Text 在 XCUITest 树中可能出现两层同 label 的 StaticText（坐标相同），WDIO 10 严格选择器模式下报错，需 `$$()[0]`。
- iOS C10：`appium:language` / `locale` capability 会重启 SpringBoard / locationd / tccd / akd（驱动日志明示），之后 WDA 断开；`mobile: launchApp` 的 `arguments: ['-AppleLanguages','(ja)','-AppleLocale','ja_JP']` 只改本 app，可用。
- iOS S7b：`mobile: configureLocalization` 把 keyboard 写成 `name@sw=layout;@hw=Automatic`（多一个 `@`），键盘不切换；`simctl spawn booted defaults write -g AppleKeyboards -array "zh_Hans-Pinyin@sw=Pinyin10-QWERTY;hw=Automatic" "ja_JP-Romaji@sw=QWERTY-Japanese;hw=Automatic"` 后，候选栏是可定位的 Cell（label 如 “测试, 测试的测，考试的试”），“Next keyboard” 按钮切换键盘；系统记住上次使用的键盘。Android AOSP 只有 LatinIME。
- Android C1：AOSP 模拟器默认未登记指纹，`fingerPrint()` 前需 `adb shell locksettings set-pin 1111` + 设置 app 内登记（`adb emu finger touch 1` × 约 10 次）；测完 `locksettings clear --old 1111` 恢复。失败（未登记 id）后系统弹窗不关闭，需点 `button_negative`。
- Android C2（GAPIS）：Chrome Custom Tab 内的网页输入框 / 按钮可直接作为原生元素操作，首次即通过。
- 5 轮（2026-11-18）：iOS 530–542 s / 轮、Android 368–519 s / 轮，均 23/23 spec 全绿。

### Maestro Android：启动中的点击使注入触摸全部失效（2026-11-18，API 36 AOSP）

- 现象：登录时点击密码框、登录按钮无效（两段文字都进了邮箱框，或什么都没输入）；一旦出现，之后所有场景都失败，`adb shell input tap` 也无效；重启模拟器后恢复。重启后第 1 个场景就可能出现，频率约 1/6（S1 单独循环）。
- 根因（logcat）：Maestro 在 app 刚启动、窗口还没有输入通道时（只有 `ActivityRecordInputSink`）就点击第一个元素 → `InputDispatcher: Dropping event because all windows would just receive ACTION_OUTSIDE`（DOWN 被丢弃）→ 之后每次注入都报 `Inconsistent event … Invalid DOWN event - pointers already down for device DeviceId(-1)` / `Input event injection from pid … failed`。注入设备 -1 上的 0 号手指一直被记为按下，Maestro 与 `adb shell input` 都用这个设备注入，所以都失效。
- 解除：注入一个 UP（`adb shell input motionevent UP x y`）立即恢复；`am force-stop` 后重新启动 app 也恢复（窗口重建）。Maestro 的 `clearState` + `launchApp` 不能恢复。
- 之前误判为 launcher（`recents_animation_input_consumer`）问题，实际无关。
- Appium 5 轮未遇到：UiAutomator2 的 `activateApp` 等界面空闲后才返回。
- 对策：正式版在 Android 的重置后加 `waitForAnimationToEnd`（W3），等启动画面静止后再操作。

### Quiesco 0.7.0：发现的工具问题（2026-11-19，接入时实测；作为对 Quiesco 的反馈）

已提交 GitHub issue（h2nology/quiesco，2026-11-19）：#44（下 1）、#45（下 7）、#46（下 8）、#47（下 2）、#48（下 5）、#49（下 3）、#50（下 4）、#51（下 9）、#52（S3：`type()` 一次写入整段）、#53（下 10）、#54、#55（下 6）

1. **Android：`scrollTo` / `scrollToEdge` 在带 `RefreshControl` 的列表上失效。** RN 0.88 在 Android 上用 `AndroidSwipeRefreshLayout` 包住 ScrollView；agent 的 `findScrollable`（`@quiesco/agent/src/actions/js.ts`）取组件的第一个 host 节点当滚动视图、其第一个子节点当内容，在这里分别是刷新布局和 ScrollView 本身（rect 相同），偏移恒为 0 → 拖一次就判定“已到两端”（`Scrolled … to both ends without finding …`）。iOS 的 RefreshControl 是 ScrollView 的子节点，不受影响。测试中改为手写的 `scroll()` 循环（W2）。
2. **Android：`openNotification` 只在通知栏中找 5 秒**（`NOTIFICATION_WAIT_MS = 5_000`，写死，不受 `timeoutMs` 影响；iOS 为 10 秒）。本 app 的本地通知在切到后台后约 5 秒才发出，时间踩线；通知不以横幅出现，`system.expectVisible` 等不到。测试中改为找不到时再试（W2）。
3. **Android：app 自己的对话框窗口（`DateTimePicker` 的系统日期对话框）无法用真实触摸操作。** 文档写明只能用 `setValue`（回调）；`system.tap` 只看其他 package 的 UI。S8 的通过标准禁止直接设值 → 用外部命令（`uiautomator dump` + `adb shell input tap`）。
4. **iOS：inline 日历（原生 UIDatePicker）的日期格子不在元素树中**，`system.tap` 也只看 app 之外 → 按元素内相对坐标点击（依赖地区设置的星期起始日）。
5. **`openUrl()` 不能在 app 处于后台时调用**（报错提示先 `bringToForeground`），S21“后台时打开深链接”需外部命令。
6. **`quiesco doctor` 不支持 app 与测试工程分开的布局**（无指定 app 目录的选项）；`quiesco list` 把 `test.beforeEach(fn)` 列成一个测试；`quiesco()` 的 `isolate: false` 使共用模块顶层注册的 hook 只对第一个文件生效（需在每个文件中注册）。
7. **`scrollTo` 在目标露出一条细边（`visibleRatio > 0`）时就停下，`tap` 瞄准整个矩形的中心**，中心可能落在滚动视图的裁剪范围之外（列表上方的标题栏）；`hitTest` 不考虑祖先的裁剪，不报 `ELEMENT_OBSCURED`，点击“成功”却没点到（S6 iOS 5 轮中 2 次）。测试中补一次拖动并断言 `ratio: 1`（W2）。
8. **横向轮播（嵌套在纵向列表中）上 `scrollTo` 同样误判“已到两端”**（iOS、Android 都发生；C5）；`scroll()` 的 `distance` 在该轮播上不起作用（每次约 445 pt）。
9. **iOS：其他进程的 UI 不在 `system.*` 的可见范围内**：分享面板（C3）、ASWebAuthenticationSession 中的网页（C2）、软键盘（S7b）都报 “on screen outside the app: nothing”；app 内注入的触摸也到不了。iOS 模拟器没有从外部点击 / 输入的命令 → C2、C3、S7b iOS 记 ✗（Appium / Maestro 经 XCUITest 能操作）。Android 上 `system.*` 能读到 Custom Tab 与分享面板，但没有输入文字的 API（C2 用 `adb shell input text`）。
10. **iOS `setLocale` 要求 Info.plist 声明 `CFBundleLocalizations`**（Appium / Maestro 直接传 `-AppleLanguages` 不需要）→ 只在 Quiesco 构建中声明（用户决定，2026-11-19）。
11. 环境：iOS 模拟器的 `AppleLocale` 原为不规范的 `US`（日历周一开头），按 METHODOLOGY 6.4 改为 `en_US`。harness 需统一设置。

### Quiesco 0.8.0：上面各问题的验证结果与新发现（2026-11-19）

0.8.0 关闭了 #44–#55。升级后在本仓库实测：

| 问题 | 0.8.0 实测 |
|---|---|
| #44 Android RefreshControl 列表上 `scrollTo` 失效 | 已修复：列表确实滚动（见下 N1） |
| #45 露细边就停 / 点到列表外 | 已修复：S6 iOS 不再需要补拖动，5 轮未再出现 |
| #46 横向轮播 `scrollTo` / `distance` | 已修复：C5 两平台直接 `scrollTo('carousel', 'carousel-slide-6')` 通过 |
| #47 Android `openNotification` 5 s | 已修复：S22 Android 不再需要重试 |
| #48 后台 `openUrl()` | 已修复：S21 两平台不需要外部命令 |
| #49 Android app 自己的对话框 | 已修复：S8 Android 用 `system.tap({ text: '25' })` |
| #50 iOS inline 日历 | 已修复：S8 iOS 用 `system.tap({ text: '25' })`，不再依赖坐标和地区 |
| #51 iOS 其他进程的 UI / `system.type` | 已修复：C2 iOS（认证页面）、C3 iOS（分享面板）、S7b iOS（键盘按键）通过；C2 Android 用 `system.type` |
| #52 逐字输入 | 已修复：S3 用 `type(…, { perCharacter: true })` |
| #53 `setLocale` 要求 `CFBundleLocalizations` | 已修复：去掉声明后 C10 iOS 通过（输出警告：`Intl` 与原生字符串仍为 bundle 的语言） |
| #54 app 与测试工程分开 | 已修复：`appDir` 后 `doctor` 全部通过。`quiesco build` 可用，但 prebuild 不加 `--clean`，本仓库仍用 `build.sh` |
| #55 `list` 列出 hook / 共用 hook | 已修复：`list` 正确；重置改为 `setupFiles` |

0.8.0 中新发现的问题（已提交 GitHub issue，h2nology/quiesco，2026-11-19：#63（N1）、#64（N2）、#65（N3）、#66（N4）、#67（N5，question）、#68（N6））：

- **N1 `scrollTo` 的超时是整个调用合计，且超时后误报“已到两端”。** `@quiesco/agent` `src/runtime.ts` 中 `scrollTo` 在进入循环前设一个 `deadline`（默认 `sync.timeoutMs` 10 s），向下的循环到时 `break`，向上的循环第一步也 `break`，然后抛 `ELEMENT_NOT_FOUND “Scrolled … to both ends”`。Android S6 实际滚动了约 7,900 dp（约 150 行，37 步中的 15 步）。`scrollToEdge` / `scrollToIndex` 属于多步操作，每步都有完整超时（`multiStep`），`scrollTo` 不是。iOS 上同样超时（报 `SYNC_TIMEOUT`）。正式版两平台都放宽 `timeoutMs`（W3）。
- **N2 iOS `openNotification` 的计时包含 XCUITest runner 的启动。** `@quiesco/core` `src/devices/ios.ts` 的 `openNotification` 先设 `start` / `deadline`，第一次 `runner.screen()` 才启动 runner（通常约 7 s，正式版第 1 轮 14.4 s）。返回时已过期限 → 不打开通知中心就报 “seen: nothing”。正式版放宽 `timeoutMs` 到 30 s（W3）。
- **N3 iOS `openNotification` 在通知中心的分组上崩溃。** 0.8.0 改为 2 s（`BANNER_WAIT_MS`）后就打开通知中心；本 app 的通知 3 s 后才发出，进入通知中心里已有的同一 app 的分组（之前各轮留下的通知，重启不清除）。第一次点击把分组展开（“still on screen after the tap; tapping it again”），XCUITest runner 的 `/screen`（`ios-runner/Runner/SystemUIServer.swift` 用 `allElementsBoundByIndex` 逐个读取）在列表重排时报 “No matches found for Element at index 19”，runner 退出，测试得到 `TypeError: fetch failed`（`ECONNRESET` 不在 runner 的自动重启条件内，`ios-runner.ts` 的 `isConnectionRefused`）。诊断版出现 1 次（runner 已在运行时）；单独重跑 3 / 3 通过。
- **N6 iOS `openNotification` 把横幅自行消失当作点击成功。** 点击后 1.5 s 内通知从屏幕上消失就算成功（`ios.ts` 的 `NOTIFICATION_TAP_CONFIRM_MS`）；横幅到时间自己收起也满足这一条件。正式版重跑第 2 轮：runner 启动 9.6 s，没有出现 “still on screen” 警告，app 的 device.log 在 `appDidSuspend` 之后没有任何回到前台的记录，随后报 “the app did not become active within 5000ms”，下一个测试的 reset 也超时（推断，未证实）。
- **N4 Android：打开系统弹窗的动作之后，空闲等待可能永久挂起（0.7.0 起就存在）。** `@quiesco/agent` `src/sync/wait-for-idle.ts`：app 在后台时（权限弹窗是另一个 Activity），Android 暂停 JS 定时器；等待循环只在 AppState 变化事件到来时被唤醒一次，若此时有 tracker 忙（react / network / idle-callback），就再次 `sleep()` 在暂停的 `setTimeout` 上，既不返回也不超时（超时检查也在 sleep 之后），宿主 15 s 后报 AGENT_TIMEOUT。下一个测试的 reset 也同样挂起，直到 Quiesco 重启 app。S10b Android 正式版 5 轮中 1 次 → 那次点击用 `{ sync: false }`（X）。与 0.7.0 对比（npm 缓存中的 tarball）`wait-for-idle.ts` 与 `QuiescoNativeModule.kt` 相同，0.7.0 的 5 / 5 是时机上的运气。
- **N5 原生模块的 Promise 不计入忙碌。** tracker 只有 network / timer / react / idle-callback / native（iOS 转场）/ frame-stable。本 app 登录时 `await AsyncStorage.setItem` 期间所有 tracker 空闲，登录的 `tap` 可能在首页的首次请求发出前返回（S18 Android 5 轮中 1 次，W3）。是否算缺陷有待 Quiesco 判断（文档未承诺覆盖）；Appium 在同一处也需要等待。
- 环境：iOS 模拟器的通知中心里积累了各工具各轮 S22 留下的通知（重启不清除），harness 应在每轮前清空（M4）。

### Quiesco 0.9.0：#63–#68 的验证结果与新发现（2026-11-20）

0.9.0 关闭了 #63–#68。升级后在本仓库实测（正式版两平台各 5 轮，每轮前重启模拟器）：

| 问题 | 0.9.0 实测 |
|---|---|
| #63 `scrollTo` 整个调用一个超时 / 误报“两端” | 已修复：每一步单独计时。S6 iOS 诊断版通过（48 s），正式版不再需要 300 s 的 `timeoutMs`。Android 见下 N2 |
| #64 iOS `openNotification` 计时含 runner 启动 | 已修复：S22 iOS 诊断版、正式版 5 / 5 都用默认 10 s 通过 |
| #65 iOS 通知分组上 runner 崩溃 | 5 轮未再出现（通知中心未清空，与 0.8.0 相同的环境） |
| #66 Android 弹窗期间空闲等待挂起 | 去掉 `{ sync: false }` 后 S10b Android 5 / 5 通过 |
| #67 原生模块 Promise | 新增 `native-module` tracker（默认关闭）。未开启、去掉 S18 的等待后 S18 Android 5 / 5 通过（0.8.0 时 5 轮中 1 次失败，偶发问题，5 轮不能证明消失）。开启它也不能绕过下面的 N1 |
| #68 横幅自行消失被当作点击成功 | 5 轮未再出现 |
| `quiesco build --clean`（0.8.0 时 U6） | 可用：`build.sh` 删除，改为 `quiesco build ios|android --clean` |

0.9.0 中新发现的问题：

- **N1 app 在 S12（左滑删除）中崩溃，两平台 5 / 5（已提交 h2nology/quiesco#74，2026-11-20）。** `@quiesco/agent` `src/sync/native-module.ts` 在 app 启动时替换 `TurboModuleRegistry.get` / `getEnforcing`，返回方法被 JS 函数包装的 `Proxy`；源码注释写明 tracker 关闭时也安装（“while it is off a wrapped call only passes through”）。react-native-gesture-handler 3.3.0 `src/v3/NativeProxy.ts` 从 `RNGestureHandlerModule` 解构出 `flushOperations` / `updateGestureHandlerConfig`（注释：“to have a raw HostFunction reference”），在 worklet 中于 UI runtime 上调用；拿到的是 Quiesco 的 JS 包装函数 → Worklets 报 “Tried to synchronously call a Remote Function”（Android `FATAL EXCEPTION`；iOS `SIGABRT`，栈为 `worklets::runSyncOnRuntime` → `HermesRuntimeImpl::throwPendingError`）。`ReanimatedSwipeable` 在滑动结束时调用。测试侧无法绕过（`ignoreNativeCalls` 只是不计数，仍然包装）。连带影响：下一个测试（S6）的 reset 先等崩溃的 app 重连 30 s，再重启 app（S6 在整套中约 63 s，单独约 36 s）。
- **N2 S6 Android：一步之后的空闲等待超过 10 s（诊断版 1 次）。** 每一步单独计时后，0.8.0 中“每步约 16 s”的慢状态变成 `SYNC_TIMEOUT`：`timer: setTimeout(50ms)`（VirtualizedList 的分批渲染）、`react`、`frame-stable`（元素树 4,318 节点，每次加 1 行，9.5 s 内只采样 270 帧）。单独运行 6 次都约 36 s 通过；正式版 5 轮也都通过（30 s 的每步超时，W3）。原因仍未定（CPU 渲染的模拟器上 FlatList 逐批补齐窗口，属于 app 确实在忙）；不作为 Quiesco 缺陷提交。
- **N3 `@quiesco/core` 0.9.0 发布时残留调试输出（已提交 h2nology/quiesco#75）。** `dist/session.js`、`dist/device.js` 中有 `console.error("DBG resetDeviceState end", …)` / `"DBG driver.reset start"` / `"DBG waitForApp start"`，每个测试前都输出到 stderr（每轮约 70 行）。只在 `dist` 中，同一包的 `src` 没有 → 发布的构建与源码不一致。不影响结果。
- **N4 iOS `system.tap` / `system.tapAt` 在系统 UI 出现动画结束前点击，点击丢失（调查完成，2026-11-20）。** 现象：C1（Face ID 失败后的 “Cancel”）、C3（关闭分享面板）偶发失败；C11 → C1/C3/C2 子集 5 次重复中，紧跟 C11 的 4 次里失败 2 次，其他位置 0 次。插件 `failure-investigator` 读模拟器统一日志（`simctl spawn booted log show`），执行者核对：失败时 testmanagerd 的 `touch down {201, 515}` 在 11:29:17.852，LocalAuthenticationUIService 的 “Holding FaceIdViewController”（呈现完成）在 17.867，触摸只到 SpringBoard 的 `_UISystemGestureWindow`；11 s 后同一坐标的点击到达 `LACUISecureWindow` → “CancelButtonPressed”（坐标正确，只是时机）。呈现开始到完成约 430–615 ms，0.9.0 的 `/screen`（一次快照，约 50 ms）在约 200–400 ms 时就找到并点击。C3 同样：点击早于 `UIActivityViewController ViewDidAppear`。`src/device.ts` 的 `system.tap` / `expectVisible` / `tapAt` 在第一次匹配后立即点击，没有稳定检查；`openNotification` 已有“两次读取一致才点”（`src/devices/ios.ts:847-852`）。C11 本身不是原因：runner 冷启动（5–10 s）落在触发与读取之间，掩盖了竞争；runner 热时任何顺序都可能发生。测试侧没有不加 sleep / 重试的办法。另一种现象（Face ID 对话框在屏幕上，SpringBoard 快照中却没有；刚启动的 LocalAuthenticationUIService 进程，XCTest 取了错误的窗口）可信度较低，未复现。正式版中 S10b（权限弹窗 `system.tap`）理论上有同样风险，5 轮未出现。
- **N5 app 崩溃时的报告与恢复（已提交，2026-11-20）。** #76：`AGENT_DISCONNECTED` 只报 close code，不说 app 崩溃及原因（Android 的 `FATAL EXCEPTION` 在 device.log 中，iOS 的崩溃报告只在 `~/Library/Logs/DiagnosticReports`）。#77：崩溃后证据收集与下一个测试的 reset 各等 `connectTimeoutMs`（30 s）才重启 app，每次崩溃约浪费 60 s。
- **N6 `scrollTo` 某一步中的 `SYNC_TIMEOUT` 不带步数 / 偏移（已提交 h2nology/quiesco#78）。** `src/runtime.ts` 的步骤循环中 `syncIfNeeded` 的异常原样抛出；timeline 只有一个 `scrollTo` span；通过的测试不保存证据，S6 Android 的慢步无法与正常运行比较。
- `init --upgrade` 仍把依赖写成 `^0.9.0`，并在测试工程加回 `e2e:*` 脚本（0.8.0 时相同）→ 改回精确版本、删除。

### Quiesco 0.10.0：#74–#78 的验证结果与新发现（2026-11-20）

0.10.0 关闭了 #73–#78。升级后在本仓库实测：

| 问题 | 0.10.0 实测 |
|---|---|
| #74 `native-module` 包装使 S12 崩溃 | 已修复：S12 两平台诊断版通过（iOS 18.8 s、Android 8.5 s）。本仓库不开启该 tracker，`metro.config.js` 不需要 `nativeModules: true` |
| #75 `DBG` 调试输出 | 已修复：日志中 0 行 |
| #76 / #77 崩溃的报告与恢复 | 本次没有崩溃，未验证 |
| #78 `scrollTo` 的每一步 | 可用：`QUIESCO_ARTIFACTS=all` 时 timeline 中有每一步的 span 与 `syncMs`。但测试框架的超时先到时（调用未返回），每一步的记录不写出（见 N2） |

0.10.0 中的新发现（已提交 GitHub issue，h2nology/quiesco，2026-11-20：#82（N3）、#83（N1）、#84（N2）、#85、#86（S22 诊断版的两点）、#87（0.9.0 N4））：

- **N1 `quiesco doctor` 的 scripts 检查误报。** `quiesco/dist/packages.js:35` 的正则 `(?:^|[^\w@/.-])quiesco\s+([a-z][\w:-]*)` 把 `E2E_TOOL=quiesco quiesco build ios --clean` 中 `=` 后的 `quiesco` 当作命令开头，报 `"build:ios" runs \`quiesco quiesco\``（失败）。`build:android` 因为后面是大写的 `GRADLE_OPTS` 没有匹配。只影响 doctor 的结果，构建与测试不受影响。
- **N2 被外部超时中断的 `scrollTo` 不留下每一步的记录。** 每一步的记录在 agent 中积累，调用返回时（或 SYNC_TIMEOUT 时）才交给宿主（`@quiesco/agent` `src/runtime.ts` 的 `recordStep`）；宿主给 `scrollTo` 的时限约为 60 步 × 每步超时，远长于 Vitest 的单测超时。诊断版 S6 Android 被 Vitest 在 120 s 时中断，timeline 中没有 `scrollTo`。
- **S6 Android 的慢是测量条件造成的，不是 Quiesco 0.10.0 的退化。** 按 METHODOLOGY 6.4 重启模拟器后：诊断版 S6 36.8 s（全套 24 / 24）、单独运行 2 次 35.8 / 36.1 s（44 步，平均每步 582 ms，其中空闲等待平均 125 ms、最长 195 ms；拖动本身固定 400 ms）、正式版 5 轮 34.9–53.6 s。慢的两次都偏离了测量条件：① 第 1 次诊断版之前没有重启模拟器（已连续运行约 4 小时，执行者的疏漏），超过 120 s；② 单独运行时 `QUIESCO_ARTIFACTS=all` 同时录屏，143.6 s（平均每步 2,476 ms，空闲等待平均 1,659 ms、最长 7,445 ms）。模拟器为 lavapipe CPU 渲染，录屏与长时间运行都在抢 CPU，FlatList 分批渲染变慢，Quiesco 如实等待 app 空闲。其他工具同一场景 Android：Detox 约 120 s、Maestro 约 190 s。
- **S22 iOS 诊断版失败：环境（模拟器的通知设置被重建），与 Quiesco 无关。** 插件 `failure-investigator` 读统一日志：模拟器的 `data/Library/BulletinBoard`、`UserNotifications` 在 2026-11-20 13:46 左右重建（用户的操作），rnshootout 的通知授权丢失 → 点击 `notify-in-3s` 时 app 弹出授权弹窗，通知未排程，`openNotification` 10 s 后报 “seen: nothing”。下一场景开始时 Quiesco 清理残留弹窗点了 “Don't Allow”（`dismissButton` 优先 cancel / deny），状态变为“拒绝”。用一次性测试（`setPermission('notifications','reset')` 重装 → 弹窗 `system.allowPermission()`）恢复为“已授权”，S22 单独通过。可反馈给 Quiesco 的两点：`openNotification` 超时的 “seen” 只列 `others` 不列 `alerts`，遮住了屏幕上的授权弹窗；清理残留弹窗时选“拒绝”会在不能用 simctl 重置的权限（iOS 通知）上留下持久状态。
- **N3 iOS `openNotification` 走通知中心路径时，在 iOS 27 上几乎必败（正式版第 1 轮 S22）。** 插件 `failure-investigator` 读模拟器统一日志（执行者核对）：system UI runner 冷启动 11.8 s（第 2–5 轮 7.7–8.3 s），就绪时横幅已消失（显示约 8.4 s）→ 下拉通知中心。iOS 27 的通知中心是 Cover Sheet（SpringBoard `UILocked: 1`，但 `deviceAuthenticated true`，并未上锁），点击通知不执行默认动作，而是侧滑露出 “Open”（`Hinting side swipe instead of executing action … didExecute? NO`），约 3.1 s 后自动收回。第 1 次点击展开堆叠（#65 的处理正确），第 2 次点中最新通知（坐标正确）；`@quiesco/core` `src/devices/ios.ts` 的 `tapOpened` 先等 `NOTIFICATION_FRONT_MS`（3 s）才找 “Open”，再加 runner 点击约 1.2 s，在提示收回后（4.3 s）才落下 → 又落在通知 cell 上。点 “Open” 也没有“两次读取一致才点”。第 2–5 轮都在横幅上一次点中（`didExecute? YES`），堆叠中有 2 条旧通知也通过。触发条件：runner 冷启动超过约 10–11 s（#64 记录的冷启动为 7–15 s）。警告文案 “a locked device” 不准确。
- 0.9.0 的 N4（iOS `system.tap` 在系统 UI 呈现动画结束前点击）：0.10.0 中 `src/device.ts`、`src/devices/ios-runner.ts` 与 0.9.0 相同，提交为 #87。
- **S7b iOS 在 0.10.0 中失败 4 次（环境）。** `simctl spawn booted defaults write -g AppleKeyboards …` 写入后（包括写入后重启模拟器），软键盘只有英文、没有 “Next keyboard” 键。同一方法在 0.9.0 / Appium 时可用；模拟器的设置在 13:46 被用户重建，键盘相关的其他设置可能随之丢失。用户在“设置”中手动添加中文拼音 / 日文罗马字键盘后 2 / 2 通过（手动添加会另写 `AppleKeyboardsExpanded = 1` 等；第 2 次运行时 `AppleKeyboards` 已被还原为只有英文仍通过，所以生效的是这些其他设置）。
- `init --upgrade` 仍把依赖写成 `^0.10.0` 并加回 `e2e:*` 脚本 → 改回精确版本、删除。

### Quiesco 0.11.0：#82–#87 的验证结果与新发现（2026-11-20 – 21）

0.11.0 关闭了 #82–#87。升级后在本仓库实测（正式版两平台各 5 轮，每轮前重启模拟器）：

| 问题 | 0.11.0 实测 |
|---|---|
| #82 iOS 27 通知中心路径上 “Open” 的点击时机 | iOS 正式版 S22 5 / 5（tracker 关闭、开启各 5 轮，共 10 / 10），默认超时 |
| #83 doctor 把 `E2E_TOOL=quiesco quiesco build` 读成 `quiesco quiesco` | 已修复。新增 1 项 warning：app IDs 无法与 `app.config.ts` 比对 |
| #84 被测试框架超时中断的 `scrollTo` 不留每一步的记录 | 未复现中断（S6 未超时），未验证 |
| #85 / #86 残留通知权限弹窗 | 本轮环境中通知已授权，未出现弹窗，未验证 |
| #87 系统 UI 动画中的点击丢失 | C3 iOS 整套中通过。C1 iOS 仍在整套中失败，但现象不同（见下 N2） |

- **S6 变慢不是回归。** 诊断版 S6 iOS 68 s、Android 110 s（0.10.0 约 33–37 s）。0.10.0 → 0.11.0 的 `scrollTo` 路径上只多了每一步一条 `step` 通知（#84，`@quiesco/agent` `src/runtime.ts` 的 `recordStep`），单独运行的 timeline 中 iOS 每步约 543 ms，与 0.10.0 相同。原因是 Vitest 按上次耗时排序：0.11.0 起 S6 排在第一个，承担重启后的冷启动 15–20 s（0.10.0 时由第一个的 S22 / S12 承担：S22 40.6 s、S12 16.1 s → 0.11.0 为 19.2 s、10.4 s）；整轮耗时不变（iOS 335–344 s，0.10.0 为 338–366 s）。Android 另受宿主机负载影响：同一构建、同为重启后单独运行，负载约 5 时约 35 s，负载 10–16 时 90–165 s；`native-module` tracker 开 / 关对照（各 2 次）无差别。
- **N1 S18 Android 失败 1 次（#67 的已知限制，不是回归）。** tracker 关闭时正式版第 1 轮：登录的 `tap` 在 app `await AsyncStorage.setItem`（`app/src/lib/store.ts:44`）期间返回（默认 tracker 都空闲），测试随后注入的一次性 500 被首页首次 `/items` 用掉（mock server 先延迟再匹配规则，`mock-server/src/server.ts:185-186`），之后 `list-reload` 拿到正常结果。0.9.0 / 0.10.0 的 5 / 5 是时机上的运气（0.9.0 的表中已注明“5 轮不能证明消失”）。用户决定开启 `native-module` tracker：两平台诊断版、正式版 5 轮、能力检查全部重跑，S18 两平台 5 / 5，S12 不崩溃，整轮耗时无可见增加。
- **N2 C1 iOS：重启后第一次 Face ID 提示读不到（h2nology/quiesco#92）。** 整套中 `system.tap({ text: 'Cancel' })` 10 s 内找不到，报错列出的 “Back / Biometric / Unlock / Locked / Toolbar” 是 app 自己的视图，失败截图上对话框和 “Cancel” 都在。用探针测试直接查询 runner（`/screen`、`/elements?bundleId=…`，2026-11-21）：模拟器启动后第一次出现的 “Face Not Recognized” 对话框不在 SpringBoard 的树中（`/screen` 持续为空，20 s 后再试也一样），只在 `com.apple.LocalAuthenticationUIService` 的树中（state 4，含 “Cancel”）；第二次起 SpringBoard 的 `/screen` 也能读到。与 runner 何时启动无关。重启后 3 / 3 失败、不重启 2 / 2 通过，所以整套中由重启后第一个出现 Face ID 的测试承担。Quiesco 的 `systemNodes()`（`@quiesco/core` `src/devices/ios.ts`）只读 SpringBoard、`OTHER_APPS`（Safari 两个）和被测 app。本地把 `com.apple.LocalAuthenticationUIService` 加入 `OTHER_APPS`（临时改 `dist`，已还原）后，重启后原 C1 2 / 2 通过。#87 的修复与此无关（那是动画中的点击丢失）。
- **环境：无人值守运行时 macOS 睡眠。** tracker 开启后的第一次 iOS 正式版 5 轮大面积失败（S9 的 `type login-email` 约 1,000 s 后 AGENT_TIMEOUT；第 5 轮全部失败）。插件 `failure-investigator` 对照 `pmset -g log`（执行者核对）：显示器 00:25:53 关闭后，00:42 起 Idle Sleep / Maintenance Sleep，01:03 起反复 “Dark Wake Thermal Emergency” 睡眠 936–1,029 s；每个失败调用的起止与一次睡眠逐秒对应（如 01:03:33 起睡眠 1,029 s ↔ `type` 1,029,191 ms），app 的 device.log 在睡眠期间所有线程静止、无崩溃。agent 的 `type` 只执行一次、不重试（`src/actions/native.ts:360-365`），包装函数不阻塞（`src/sync/native-module.ts:158-178`）。用 `caffeinate -dimsu` 包住运行后重跑 5 × 24 / 24、无睡眠事件。METHODOLOGY 6.4 本已规定 `caffeinate -dimsu` 与关闭 Spotlight 索引，M3 的运行没有照做（执行者的疏漏；之前的运行也未防睡眠，只是显示器亮着、未进入睡眠）。M4 的 harness 需内置防睡眠，并在每次运行后检查 `pmset -g log`。
- `init --upgrade` 仍把依赖写成 `^0.11.0` 并加回 `e2e:*` 脚本 → 改回精确版本、删除。
- **N3 tracker 开启后，打开原生对话框的动作多等约 2 s（h2nology/quiesco#93）。** Android 同一构建 tracker 开 / 关对照（宿主机负载约 2，timeline 全部保存）：S8 `tap('control-date')`（`DateTimePickerAndroid.open` → `RNCDatePicker.open`）之后的空闲等待 227 → 2,105 ms；S10b `tap('request-location')`（`ExpoLocation.requestForegroundPermissionsAsync`）142 → 2,319 ms；其余动作不变。原因：这类调用要等测试回答对话框才返回，tracker 把它算作忙碌直到 `thresholdMs`（默认 2 s）。文档已写明、可用 `ignore` 排除，本仓库按默认值（不加 `ignore`）。S14 在 5 轮中偶有 +3 s，单独对照无差别（负载）。iOS 无差别。
- 其余提交的 issue（2026-11-21）：#94 tracker 默认关闭时 #67 的竞争无提示（S18 的报错只是 `expect visible failed`，证据中看不出原生调用）；#95 `init --upgrade` 把精确版本改为 `^`、加回 `e2e:*` 脚本（npm 默认不 `--save-exact`；`ensureScripts` 补回缺少的脚本）；#96 `doctor` 遇到 `app.config.ts` 总是 warning（建议用 `expo config --json --type public` 解析，本仓库约 0.6 s）。

### Quiesco 0.12.0：#92–#96 的验证结果与新发现（2026-11-21）

0.12.0 关闭了 #92–#96。升级后在本仓库实测（`suites/quiesco/scripts/full-check.sh`：诊断版 → 正式版两平台各 5 轮 → 能力检查，每次运行前重启模拟器，`caffeinate` 下运行，区间内无睡眠事件）：

| 问题 | 0.12.0 实测 |
|---|---|
| #92 重启后第一次 Face ID 对话框读不到 | **已修复**：C1 iOS 在整套能力检查中（重启后）通过（0.10.0 / 0.11.0 整套中 3 / 3 失败）。`SystemUIServer.swift` 的 `OTHER_APPS` 加入 `com.apple.LocalAuthenticationUIService` |
| #93 打开原生对话框的动作多等约 2 s | **已修复**：Android 正式版中位数 S8 14.8 → 12.8 s、S10b 11.6 → 8.9 s，与 tracker 关闭时（12.7 s、8.7 s）相同。默认忽略列表（`DEFAULT_IGNORED_NATIVE_CALLS`）含 `RNCDatePicker.open`、权限请求等 |
| #94 tracker 默认关闭时竞争无提示 | **已修复**（改为默认开启）：config 中删除 `sync.trackers` 后，S18 两平台 5 / 5。`@quiesco/agent` `runtime.ts:304` 为 `config.sync.trackers['native-module'] ?? nativeModulesWrapped`，连接日志为 `native module true` |
| #95 `init --upgrade` 改写版本、加回脚本 | **已修复**：直接写成精确版本，不加 `e2e:*` 脚本 |
| #96 `doctor` 与 `app.config.ts` | **已修复**：`doctor` 全部通过、无 warning |

- 速度：各场景中位数与 0.11.0 相同（±0.3 s），除 #93 的 Android S8 / S10b。整轮墙钟 iOS 336–344 s、Android 224–226 s（运行时宿主机负载低，S6 Android 约 35 s）。
- **N1 S22 iOS 诊断版失败 1 次：runner 冷启动 + 通知中心中的通知堆叠。** `sendToBackground()` 时预先启动的 system UI runner 用了 12.3 s（正式版各轮 7.3–11.2 s），通知（3 s 后）的横幅已过 → 通知中心路径。通知中心里留着前一天运行的 2 条同 app 通知（模拟器重启、app 重装都不清除），新通知与之堆叠：第 1 次点击只展开堆叠（`tapOpened` 的 `expanded()` 返回 false），第 2 次点击露出 “Open”，但此时 `openNotification` 的 10 s 默认超时已到，“Open” 需要两次读取一致才点、超时后只读一次 → 失败（报错 `tapped "Hello from rnshootout" 2 time(s)`，`seen` 与截图中都有 “Open”）。重启后重跑通过（runner 8.2 s）；正式版 5 / 5（横幅路径）。两个因素（冷启动慢、堆叠多花一次点击）叠加才失败，超时本身从 runner 就绪后才开始算（`openNotification` 在 `prepareSystemUi()` 之后取 `start`），但就绪后仍先等 `BANNER_WAIT_MS`（5 s）横幅，横幅早已消失，10 s 中白白用掉一半。已提交 h2nology/quiesco#100（2026-11-21）。
- `full-check.sh` 的睡眠记录过滤把非日期开头的行也列出（误显示多行 “Sleep/Wakes since boot”），已改为只看日期开头的行；按日期直接查 `pmset -g log`，运行区间（17:52–18:57、19:00–19:04）内无睡眠事件。

### Quiesco 0.12.1：#100 的验证结果与新发现（2026-11-21）

0.12.1 关闭了 #100，只改了 `@quiesco/core` `src/devices/ios.ts` 的 `openNotification`：横幅等待从调用开始算（runner 晚于横幅就绪时直接打开通知中心）；点击后在超时之外再给 3 s（`NOTIFICATION_TAP_GRACE_MS`）供展开堆叠、点 “Open”；露出的 “Open” 超时后也会确认并点击；通知在点击后上下移动（通知中心刚拉下时列表还在布局）即视为没点中、立即重点。其他包只有版本号变化。

| 问题 | 0.12.1 实测 |
|---|---|
| #100 通知中心中的堆叠 + 横幅等待 → 超时 | **已修复**：iOS 正式版 5 / 5，其中第 2、3 轮走了通知中心路径（runner 10.9 s / 8.7 s；第 2 轮：点击 → 展开 → 再点 → “Open” → 打开，34.4 s；第 3 轮 27.5 s），都通过。诊断版 24 / 24 |

- 速度：各场景中位数与 0.12.0 相同（±0.3 s）。iOS S23 21.7–26.4 s（0.12.0 21.7–25.5 s），改动不在其路径上，视为波动。
- **N1 S6 Android 正式版第 5 轮 SYNC_TIMEOUT：FlatList 窗口边缘反复增删（推断）。** 插件 `failure-investigator` 读证据（执行者核对行高与 FlatList 设置）：`scrollTo` 第 1–20 步每步 0.52–0.66 s（空闲等待 74–177 ms），第 21 步拖动后空闲等待 29,551 ms 超时。忙碌只有 FlatList 的 50 ms 批处理定时器（`updateCellsBatchingPeriod`）、React 提交与元素树每隔一帧变化；最后一次变化为 268 → 269 行，而超时后抓的树为 268 行 → 一行被加上又去掉。已渲染的行（1–10 与 67–322）已填满 `windowSize` 21 在偏移 9768 时的窗口 [3428, 16742]，两端离行边界 2–4 px；行高 51 / 52 交替，app 未设 `getItemLayout` → VirtualizedList 每次行布局变化都重算窗口，边缘一行可能来回切换。宿主机负载：约 29 fps（该 CPU 渲染模拟器的正常值），日志无 GC、掉帧、ANR；同轮其他场景耗时正常。0.12.1 没有改 Android 代码 → 判断为 app（FlatList）侧的偶发行为，Quiesco 如实报告忙碌。证据只有最后一帧，“持续 30 s 反复增删”是推断（置信度中等）。放宽超时无意义（不收敛）。按现状记录（不改 app）；提交 h2nology/quiesco#102（2026-11-21）：`frame-stable` 只留最后一次变化，看不出 A → B → A；建议记录最近几次变化、检测两态交替并在报错中提示 `getItemLayout`。

### Quiesco 0.13.0：#102 的验证结果与新发现（2026-11-22）

0.13.0 关闭了 #102，只改了 `@quiesco/agent` 的 `src/sync/frame-stable.ts`（及 `tracker.ts` / `wait-for-idle.ts` 的接口）：超时报告列出最近 6 次变化（时刻、节点数、第一个不同的节点）；最近 20 次变化中同一节点来回变化（双向各 ≥ 2 次）时点名，若是元素增删则提示 FlatList / VirtualizedList 无 `getItemLayout`；`idle-state.json` 的 `lastWait` 保留最后一次等待结束时的原因。空闲判定逻辑不变（仍算忙碌）。其他包只有版本号变化。

| 问题 | 0.13.0 实测 |
|---|---|
| #102 FlatList 窗口边缘反复增删时的诊断 | **已实现，且实际遇到**：诊断版 Android S6 在与 0.12.1 相同的位置（第 21 步，偏移 9768）超时，报错为 `the same change went back and forth in 20 of the last 20 changes (since +8107ms): RCTView @0,-9584 411x16744 children=269 ↔ … children=268, an element added and removed: a list adding and removing an item at the edge of its render window? …`，`recent changes (109 in 9559ms)`，相邻两次间隔约 67 ms。0.12.1 时的推断（置信度中等）由此确认 |

- 速度：各场景中位数与 0.12.1 相同（±0.5 s）。去掉 S6 / S12 / S22 / S23 与每轮第一个场景后，iOS 每轮 234–239 s（0.12.1 233–237 s）。iOS S22 中位数 17.8 → 21.9 s：runner 就绪 8.1–15.5 s，第 5 轮 S22 排第一个（重启后冷启动，36.3 s）；`@quiesco/core` 未改。
- **N1 S22 iOS 正式版第 4 轮：iOS 键盘的 `didShow` 迟到 10.4 s。** `login()` 中 `type('login-password', …)` 前的空闲等待 10 s 超时，`native: keyboard moving`；截图中键盘已完全显示、邮箱已输入。设备日志：`willShow` 00:30:34.538 → UIKit 读取剪贴板（`Retrieving local-only general pasteboard` 00:30:34.620，完成 00:30:44.891）→ `didShow` 00:30:44.942。`@quiesco/native` `KeyboardMotion` 在 `keyboardWillShow` 置 `moving`、`keyboardDidShow` 清除（0.12.1 起未改），所以报告字面正确，根因是 iOS 系统侧的一次卡顿（同一时间段其他运行未见）。改进余地：`willShow` 的 userInfo 带动画时长（`UIKeyboardAnimationDurationUserInfoKey` 0.3833），可在时长 + 余量后视为停止；或报错中写明“willShow 之后 N s 没有 didShow”。已提交 h2nology/quiesco#104（2026-11-22）。
- **N2 Android 模拟器进程退出。** 第一次 Android 正式版第 2 轮 S7a 中，`qemu-system` 进程在 00:47 消失：设备日志此前正常（最后一行 00:47:39），无 DiagnosticReports、`pmset` 无睡眠、磁盘剩余 459 GB、Android Studio 未运行。原因不明，不计入结果；冷启动模拟器（`-no-snapshot-load`，AVD 本身 `hw.gpu.enabled=no`）后重跑 5 轮。`reboot-android.sh` 的 `adb wait-for-device` 无超时，`full-check.sh` 停在这里约 3 小时 → M4 harness 需给模拟器重启加超时、检查进程是否存在。
