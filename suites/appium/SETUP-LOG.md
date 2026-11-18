# Appium 接入记录

> 易用性数据（METHODOLOGY 10.3）。执行者：Claude（AI 助手），代表 Quiesco 作者一方执行；对 app 已经熟悉（M2 由同一执行者实现），且此前已接入过 Detox，因此“首个测试通过时间”仅供参考（METHODOLOGY 10.2）。

## 依据的文档（2026-11-18 访问）

- Appium Quickstart：https://appium.io/docs/en/latest/quickstart/ （Install：`npm install -g appium`；驱动另装；JS 示例为不用测试运行器的独立脚本）
- Appium 3 → 4 迁移指南：https://appium.io/docs/en/latest/guides/migrating-3-to-4/ （Node ≥ 22.22.2；全部包 ESM-only；`--drivers=` 安装钩子移除）
- 扩展管理：https://appium.io/docs/en/latest/guides/managing-exts/ （项目 `package.json` 声明 appium 与驱动时，`npx appium` 自动使用项目内的驱动）
- WebdriverIO Appium Service：https://webdriver.io/docs/appium-service （写的是“WebdriverIO 10 requires Appium 3”，peer 依赖为 `appium >=3`）
- XCUITest 驱动 execute methods：https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/
- WebdriverIO 移动端命令：以 `node_modules/webdriverio/build/commands/mobile/*.d.ts`（10.2.0）为准，官网 API 页信息不全

## 版本

| 包 | 版本 |
|---|---|
| appium | 4.0.0 |
| appium-xcuitest-driver | 13.1.1（WebDriverAgent 17.0.2） |
| appium-uiautomator2-driver | 9.2.1 |
| webdriverio / @wdio/cli / local-runner / mocha-framework / appium-service / junit-reporter / spec-reporter | 10.2.0 |

## 步骤

| # | 时间 | 操作 | 类型 | 结果 / 问题 |
|---|---|---|---|---|
| 1 | 8 s | `E2E_TOOL=none npx expo prebuild --clean`（不加任何插件） | 命令 | 成功。**Appium 不需要改 app**（无插件、无原生代码、无 app 代码改动） |
| 2 | 447 s / 309 s | iOS：`pod install` + `xcodebuild` Release；Android：`./gradlew assembleRelease`（并行） | 命令 | 成功。产物复制到 `suites/appium/build/`（`build.sh`），避免被其他工具的 `prebuild --clean` 删掉 |
| 3 | 22 s | `npm init -y`、`npm i -D appium@4.0.0 appium-xcuitest-driver@13.1.1 appium-uiautomator2-driver@9.2.1` | 命令 | 成功。官方只写全局安装，为固定版本改为项目本地安装（官方扩展管理指南支持） |
| 4 | 约 30 s | `npx appium driver doctor xcuitest` / `uiautomator2` | 命令 | 无必需修复。可选：ffmpeg、bundletool、gstreamer（录屏、AAB、投屏用，本项目不需要） |
| 5 | 33 s | `npm i -D webdriverio @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/appium-service @wdio/junit-reporter @wdio/spec-reporter`（均 10.2.0） | 命令 | 成功。npm 11 拦截 edgedriver / geckodriver / esbuild 的 install script（桌面浏览器驱动等，移动端不需要）→ `npm install-scripts deny`。官方向导 `npm init wdio` 是交互式的，改为手动安装并手写配置 |
| 6 | — | `package.json` 改为 `"type": "module"`；手写 `wdio.conf.js`（两个平台的 capabilities、关闭重试、junit 输出）与 `test/support.js` | 手动编辑 | Appium 4 起全部包 ESM-only |
| 7 | 18 s | Android：`VARIANT=diagnostic` S1 | 命令 | 失败：登录后列表不出现。app 通过 `localhost:4000` 访问 mock server，Appium 不做 `adb reverse`（Detox 有 `reversePorts`）→ 在 `onPrepare` 中执行 `adb reverse tcp:4000 tcp:4000` |
| 8 | 18 s | Android S1 再跑 | 命令 | **首个测试通过（Android）**，约 09:14（从第 1 步 09:07 起约 7 分钟，含并行构建的等待）。Appium 4.0.0 与 WDIO 10.2.0 可配合 |
| 9 | — | iOS S1：重置中 `mobile: setPermission` 后 WebDriverAgent 断开（ECONNREFUSED 8100） | 坑 | `setPermission` 走 applesimutils，约 10 s 且使 WDA 断开 → 改用 `mobile: simctl privacy reset all` |
| 10 | — | iOS S1：邮箱框丢字符（`us@example.com` 等，每次不同） | 坑 | 默认输入速度下丢 1–3 个字符；sleep、等键盘出现都无效。XCUITest 驱动文档对输入错误建议调 `appium:maxTypingFrequency`：30 仍丢，20 冷启动下仍 4/8 失败；关闭 `keyboardPrediction` 1/8。最终改为先输入第一个字符、等值反映后再输入其余（冷启动 24/24），计入 WAITS.md #1 |
| 11 | — | iOS S22：对通知中心里通知卡片的 `click` / `tap()` 被识别成横向滑动，app 不打开 | 坑 | 右滑卡片露出 “Open” 再点 |
| 12 | — | iOS：系统权限弹窗（S10b）、WebView 内按钮（S9）的点击偶发被忽略 | 坑 | 没有可等待的状态，只能写手写重试（W2），见 WAITS.md #5、#6 |

## 状态重置（METHODOLOGY 5）

全部用 Appium API，不需要外部命令：

| 平台 | 做法 |
|---|---|
| iOS | `mobile: clearApp`（仅模拟器；结束 app 并清空数据容器）→ `mobile: simctl` `privacy reset all <bundleId>` → `mobile: launchApp` |
| Android | `mobile: clearApp`（`pm clear`，同时结束进程、撤销运行时权限）→ `mobile: activateApp` |
