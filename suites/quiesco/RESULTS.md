# Quiesco：接入结果（M3）

- 版本：quiesco / @quiesco/* **0.9.0**（METHODOLOGY v5；首次接入为 0.7.0，之后 0.8.0、0.9.0），Vitest 5.1.1
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，`npx quiesco build ios|android --clean`（`npm run build:*`；Android 另加 `GRADLE_OPTS=-Dorg.gradle.jvmargs=-Xmx4g`，与其他工具相同）
- **对 app 的改动**：`@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin` 依赖；`app.json` 的 config plugin；`metro.config.js`（`withQuiesco()`）；`index.ts` 入口（第一行 import agent）；根布局包 `<QuiescoRoot>`。非 e2e 构建中 plugin 把 native 模块排除出自动链接、metro 把 agent 换成空实现。0.7.0 时 C10 需要的 `CFBundleLocalizations` 在 0.8.0 中已去掉
- 重置：见 METHODOLOGY 5 的表（Quiesco 默认的 soft reset 粒度不同，另外用 `relaunch({ clearData: true })` 补齐；hook 放在 `setupFiles`）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)；工具问题：见 findings.md（h2nology/quiesco#44–#55 已在 0.8.0 关闭，#63–#68 已在 0.9.0 关闭，#74 为 0.9.0 中新发现）
- **披露**：接入使用了 Quiesco 官方的 Claude Code 插件（METHODOLOGY v4）；执行者代表 Quiesco 作者一方

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Quiesco API 以外的外部命令或对 app 的额外改动；需额外说明 = 用了与场景描述不同的方式。

## 0. 状态：**未达到 M3 完成标准**（连续 5 轮全绿）

0.9.0 修复了 0.8.0 中造成失败的问题（#63–#68），除 S12 外的 23 个场景两平台 5 轮全部通过。但 0.9.0 引入新的缺陷：**S12 中 app 崩溃，两平台每轮都发生**（h2nology/quiesco#74），测试侧无法绕过。等 Quiesco 修复后重跑。

## 1. 场景 S1–S23（正式版，0.9.0）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `type(…, { perCharacter: true })` 逐字输入 |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | `scrollTo`（真实拖动直到目标中心露出）。单测超时 300 s（W3）；Android 每一步的空闲等待 30 s（W3，诊断版 1 次超过 10 s）。单独运行约 36 s；正式版约 63 s（含上一测试 S12 崩溃后的 30 s 重连等待）。`scrollToIndex` 是 app 内部方法，场景禁止 |
| S7a 中日文（文本 API） | ✓ | ✓ | `type()` |
| S7b 中日文（经由输入法） | ✓（能力检查） | ✗ | iOS：外部命令登记拼音 / 日文键盘后，按键与候选词经 `system.tap` 点击。Android：AOSP 镜像没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 开关 `tap`；滑块 `adjustSlider`（真实拖动）；日期：两平台都 `system.tap({ text: '25' })` |
| S9 WebView | ✓ | ✓ | `app.webview()` |
| S10a 预先授权 | ✓ | ✓ | `setPermission('location', 'grant')` |
| S10b 点击系统权限弹窗 | ✓ | ✓ | `system.tap`。0.8.0 的 `{ sync: false }`（#66）已去掉 |
| S11 无限动画 | ✓ | ✓ | 不需要同步绕过 |
| **S12 左滑删除** | **✗** | **✗** | **Quiesco 0.9.0 的缺陷（#74）**：`native-module` tracker 的模块包装在 tracker 关闭时也安装，Gesture Handler 在 UI 线程 worklet 中调用的原生函数变成 JS 包装函数 → `swipe` 时 app 崩溃（iOS SIGABRT、Android FATAL EXCEPTION）。0.7.0 / 0.8.0 时 ✓ |
| S13 下拉刷新 | ✓ | ✓ | |
| S14 长按 / 拖拽 | ✓ | ✓ | |
| S15 Reanimated | ✓ | ✓ | 不需要同步绕过 |
| S16 轮询 / WebSocket | ✓ | ✓ | 不需要同步绕过 |
| S17 Toast | ✓ | ✓ | |
| S18 错误与重试 | ✓ | ✓ | 0.8.0 的等待（#67）已去掉；未开启 `native-module` tracker |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | |
| S21 深链接 | ✓ | ✓ | 热启动：后台时 `openUrl()`；冷启动：`terminate()` + `relaunch({ url })` |
| S22 本地通知 | ✓ | ✓ | `openNotification`，默认超时（0.8.0 的 30 s 已去掉）。通知权限不能预先授予，依赖本模拟器已授予的状态 |
| S23 前后台 | ✓ | ✓ | |

### 诊断版（不加任何等待）

| 平台 | 结果 | 失败 |
|---|---|---|
| iOS | 23 / 24 | S12（#74） |
| Android | 22 / 24 | S12（#74）、S6（一步之后空闲超过 10 s；单独运行 6 / 6 通过） |

0.7.0 时为 iOS 20 / 24、Android 21 / 24；0.8.0 时为 iOS 22 / 24、Android 23 / 24。

### 连续 5 轮（正式版，每轮前重启模拟器）

2026-11-20：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 23、23、23、23、23 / 24 | 413、415、403、397、396 s | 每轮 S12（#74） |
| Android | 23、23、23、23、23 / 24 | 289、286、286、287、287 s | 每轮 S12（#74） |

每轮耗时含 S12 崩溃后的重连等待（约 30 s）与 S12 本身（38–56 s）。

## 2. 能力检查 C1–C11（0.9.0）

`e2e/capability/`。各项至少 1 次通过。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | ✓ | ✓ | `biometrics.enroll()` / `fail()` / `match()`；“取消”用 `system.tap`。**iOS 在整套能力检查中 3 次里失败 2 次**（一次 `system.tap` 读不到屏幕上的 Face ID 对话框，只读到 app 的元素；一次点击 “Cancel” 报成功但状态未变），单独运行 2 / 2 通过；原因未查（0.8.0 时未出现） |
| C2 跨 app 登录 | ✓ | ✓（GAPIS） | iOS：确认框 `system.tap({ text: 'Continue' })`，认证页面经 `system.type`。Android：Custom Tab 中 `system.type`（AOSP 镜像上经 WebView shell 也通过，不作为结果） |
| C3 分享面板 | ✓ | ✓ | iOS：`system.expectVisible({ text: 'Copy' })` 后 `system.tapAt` 点面板外关闭。**iOS 整套中 3 次里失败 1 次**（点击后面板未关闭），单独运行 2 / 2 通过。Android：`system.expectVisible` 后 `pressBack()` |
| C4 选择器 | ✓ | ✓ | `{ id: 'dup-row', index: 2 }`；`{ label: 'Secret button' }` |
| C5 嵌套滚动 | ✓ | ✓ | `scrollTo('carousel', 'carousel-slide-6')` |
| C6 启动阶段 | ✓ | ✓ | 冷启动后直接 `type()` |
| C7 远程图片 | ✓ | ✓ | |
| C8 深色模式 | ✓ | ✓ | `setAppearance()` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation()` |
| C10 系统语言 | ✓（需额外说明） | ✓（需额外说明） | `setLocale()`。iOS：以 `-AppleLanguages` 重新启动（`Intl` 与原生字符串仍为 bundle 的语言）。Android：per-app language，不是改系统语言 |
| C11 远程推送 | ✓ | ✗ | iOS：`push-ios.sh`（`simctl push`）+ `openNotification()`。Android：模拟器没有推送服务，与其他工具同为 ✗ |

## 3. 各版本的比较

| 项 | 0.7.0 | 0.8.0 | 0.9.0 |
|---|---|---|---|
| 等待（WAITS） | iOS W2×1 / W3×1；Android W2×2 / W3×1 | iOS W3×3；Android W3×3 / X×1 | iOS W3×1；Android W3×2 |
| 外部命令 / 额外配置 | S8 Android、S21、C2 Android、C10 iOS（app 侧）、构建脚本 | S7b iOS 键盘登记、构建脚本 | S7b iOS 键盘登记、Gradle 内存 |
| 能力检查 | iOS C2 ✗、C3 ✗、S7b ✗ 等 | iOS 全部 ✓；Android C11 ✗ | 同 0.8.0（iOS C1 / C3 偶发失败） |
| 连续 5 轮 | 两平台 5 × 24 / 24 | iOS 3 / 5（S22）、Android 3 / 5（S6） | 两平台 0 / 5（S12 每轮，#74）；其余 23 场景 5 / 5 |

## 4. 未解决的问题

- **S12 两平台**（#74）：见上。Quiesco 修复前无法达到 5 轮全绿。
- **S6 Android**：0.8.0 中“每步约 16 s”的慢状态，0.9.0 中表现为一步之后空闲超过 10 s（诊断版 1 次）。CPU 渲染的模拟器上 FlatList 逐批补齐窗口，属于 app 确实在忙；正式版 5 轮未出现。
- **C1 / C3 iOS 偶发失败**：只在整套能力检查中出现（排在 C11 之后），原因未查。能力检查只要求至少 1 次通过，结果仍记 ✓。
- `@quiesco/core` 0.9.0 残留调试输出（`DBG …`，findings.md 0.9.0 N3）。

## 5. 出处

- 插件内的官方文档副本：`~/.claude/plugins/cache/h2nology/quiesco/0.9.0/skills/*/references/*.md`（2026-11-20）；0.8.0 / 0.9.0 release notes
- 工具缺陷的根因：`@quiesco/agent` / `@quiesco/core` 0.8.0 / 0.9.0 的源码，见 findings.md（由插件的 `failure-investigator` 读证据与源码，并经执行者核对）
- 其余结论均为本仓库实测，测试代码见 `e2e/final`、`e2e/capability`
