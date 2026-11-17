# Detox 接入记录

> 易用性数据（METHODOLOGY 10.3）。执行者：Claude（AI 助手），代表 Quiesco 作者一方执行；对 app 已经熟悉（M2 由同一执行者实现），因此“首个测试通过时间”仅供参考（METHODOLOGY 10.2）。

## 依据的文档（2026-11-17 访问）

- Detox 官方 Project Setup：https://wix.github.io/Detox/docs/introduction/project-setup —— 明确写明不涵盖 Expo，指向 Expo 的指南。
- Detox 官方支持范围：RN 0.77–0.84（SDK 58 为 RN 0.88，不在范围内）。
- Expo 官方 config-plugins 已移除 Detox 插件；使用社区插件 `expo-detox-config-plugin`（README 标注 SDK 58 需 ≥13.1.0）：https://github.com/isilher/expo-detox-config-plugin

## 版本

| 包 | 版本 |
|---|---|
| detox | 20.51.4 |
| expo-detox-config-plugin | 13.1.0 |
| jest | 29.7.0（官方文档指定 `jest@^29`；Detox peer 允许 30） |

## 步骤

| # | 时间 | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|---|
| 1 | 13 s | `npx expo install detox expo-detox-config-plugin -- --save-dev`（app 目录，按插件 README） | 命令 | 成功。`expo install` 自动把插件加进 `app.json`（会影响其他工具的构建），改为在 `app.config.ts` 中按 `E2E_TOOL=detox` 叠加；版本固定为 detox 20.51.4、插件 13.1.0 |
| 2 | — | 发现 npm 11 默认拦截 Detox 的 postinstall（构建 iOS framework / XCUITest runner、修补 Gradle） | 坑 | 读脚本内容后 `npm install-scripts approve detox` + `npm rebuild detox`；`package.json` 增加 `allowScripts`（属于 npm 11 的行为，非 Detox 本身问题，但首次接入者会遇到） |
| 3 | 1 s | postinstall 执行 | 命令 | 本机 `~/Library/Detox/ios` 已有 2026-10-22 / 11-05 的缓存，framework 构建被跳过。**首次接入的 framework 构建耗时未测到**；第三方测量“首个测试通过时间”前须清空该缓存 |
| 4 | 9 s | `suites/detox`：`npm init -y`、`npm i -D detox@20.51.4 jest@^29`、`npx detox init` | 命令 | 生成 `.detoxrc.js`、`e2e/jest.config.js`、`e2e/starter.test.js`；同样需要 `npm install-scripts approve detox` |
| 5 | — | 修改 `.detoxrc.js`：模板中 binaryPath / scheme 为 `YOUR_APP` 占位，设备为 iPhone 15 / Pixel_3a_API_30；改为本项目路径、Release 配置、iPhone 17 / iOS 27、`Medium_Phone_API_37.0`、`reversePorts: [4000]`；构建命令前加 `E2E_TOOL=detox npx expo prebuild --clean` | 手动编辑 | Expo 项目没有现成的 `ios/` `android/`，需要自己把 prebuild 串进 build 命令（官方文档不涵盖 Expo） |
| 6 | — | 状态重置：Detox 无“只清除 app 数据”的 API，采用官方的 `device.launchApp({ delete: true })`（卸载重装） | 设计 | 与 METHODOLOGY 5 的“不重新安装”不同，属于工具能力差异，在 METHODOLOGY 5 的表中记录 |
| 7 | 223 s | `npx detox build -c ios.sim.release`（prebuild --clean + pod install + xcodebuild Release） | 命令 | 成功 |
| 8 | 23 s | 编写 S1（诊断版）+ `support.js`，`VARIANT=diagnostic npx detox test -c ios.sim.release` | 命令 | **首个测试通过（iOS）**。从第 1 步（17:43:43）到此（17:49:33）约 6 分钟，不含此前查阅文档的时间。执行者为 AI 且已熟悉 app、本机有 Detox 缓存，仅供参考 |
