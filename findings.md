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
- Android 专有问题：~~`setOrientation` 文档注明仅 iOS~~（更正：当前文档只写明 iPad 限制，该说法无出处，C9 Android 需实测）；系统日期对话框的日期格子不可匹配，只能坐标点击；`device.tap` 坐标换算不可靠（传 (811,1387) 实际点到 (2249,4120)），改为基于元素的相对坐标；`web(by.id('webview'))` 匹配到 RN 外层容器，需用默认 `web`；`typeText` 后值带尾随空格（`"note "`）；键盘收起后的布局调整不被同步等待（S20 需 W1）；Detox 构建 R8 OOM 需 `-Xmx4g`。
- app 修复：长表单底部加 safe area inset（Android 15+ 强制 edge-to-edge，Submit 被导航栏遮住）。
