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
