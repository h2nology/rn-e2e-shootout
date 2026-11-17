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
