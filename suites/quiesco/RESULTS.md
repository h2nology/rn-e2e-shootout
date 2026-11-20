# Quiesco：接入结果（M3）

- 版本：quiesco / @quiesco/* **0.10.0**（METHODOLOGY v6；首次接入为 0.7.0，之后 0.8.0、0.9.0、0.10.0），Vitest 5.1.1
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，`npx quiesco build ios|android --clean`（`npm run build:*`；Android 另加 `GRADLE_OPTS=-Dorg.gradle.jvmargs=-Xmx4g`，与其他工具相同）
- **对 app 的改动**：`@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin` 依赖；`app.json` 的 config plugin；`metro.config.js`（`withQuiesco()`）；`index.ts` 入口（第一行 import agent）；根布局包 `<QuiescoRoot>`。非 e2e 构建中 plugin 把 native 模块排除出自动链接、metro 把 agent 换成空实现。0.7.0 时 C10 需要的 `CFBundleLocalizations` 在 0.8.0 中已去掉
- 重置：见 METHODOLOGY 5 的表（Quiesco 默认的 soft reset 粒度不同，另外用 `relaunch({ clearData: true })` 补齐；hook 放在 `setupFiles`）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)；工具问题：见 findings.md（h2nology/quiesco#44–#55 已在 0.8.0 关闭，#63–#68 已在 0.9.0 关闭，#74–#78 已在 0.10.0 关闭，#82–#87 为 0.10.0 中提交）
- **披露**：接入使用了 Quiesco 官方的 Claude Code 插件（METHODOLOGY v4）；执行者代表 Quiesco 作者一方

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Quiesco API 以外的外部命令或对 app 的额外改动；需额外说明 = 用了与场景描述不同的方式。

## 0. 状态：**未达到 M3 完成标准**（iOS 未连续 5 轮全绿）

0.10.0 修复了 S12 的崩溃（#74）。**Android 5 轮全绿**（5 × 24 / 24）。iOS 5 轮中第 1 轮 S22 失败：system UI runner 冷启动 11.8 s，错过横幅后改走通知中心，iOS 27 上在通知中心点击通知只露出 “Open”，Quiesco 在它收回后才点（h2nology/quiesco#82）。用户决定按现状记录，等 Quiesco 修复后重跑（2026-11-20）。

## 1. 场景 S1–S23（正式版，0.10.0）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `type(…, { perCharacter: true })` 逐字输入 |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | `scrollTo`（真实拖动直到目标中心露出）。单测超时 300 s（W3）；每一步的空闲等待 30 s（W3，0.9.0 诊断版 Android 1 次超过 10 s）。正式版 iOS 约 33 s、Android 35–54 s。Android 耗时波动大：0.10.0 诊断版（模拟器连续运行约 4 小时）超过 120 s，重启后单独运行（同时录屏）144 s，原因未定（findings.md 0.10.0）。`scrollToIndex` 是 app 内部方法，场景禁止 |
| S7a 中日文（文本 API） | ✓ | ✓ | `type()` |
| S7b 中日文（经由输入法） | **未通过（环境）**（0.8.0 / 0.9.0 ✓） | ✗ | iOS：外部命令登记拼音 / 日文键盘后，按键与候选词经 `system.tap` 点击。**0.10.0 中 4 次失败**：写入 `AppleKeyboards` 后（含写入后重启模拟器）软键盘仍只有英文，没有 “Next keyboard” 键；模拟器的设置在此前被用户重建，推测键盘相关设置随之丢失，未查明（与 Quiesco 无关，同一测试代码 0.9.0 时通过）。Android：AOSP 镜像没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 开关 `tap`；滑块 `adjustSlider`（真实拖动）；日期：两平台都 `system.tap({ text: '25' })` |
| S9 WebView | ✓ | ✓ | `app.webview()` |
| S10a 预先授权 | ✓ | ✓ | `setPermission('location', 'grant')` |
| S10b 点击系统权限弹窗 | ✓ | ✓ | `system.tap`。0.8.0 的 `{ sync: false }`（#66）已去掉 |
| S11 无限动画 | ✓ | ✓ | 不需要同步绕过 |
| S12 左滑删除 | ✓ | ✓ | `swipe`。0.9.0 中 app 崩溃（#74），0.10.0 修复（原生模块包装只在构建要求时安装；本仓库不开启 `native-module` tracker） |
| S13 下拉刷新 | ✓ | ✓ | |
| S14 长按 / 拖拽 | ✓ | ✓ | |
| S15 Reanimated | ✓ | ✓ | 不需要同步绕过 |
| S16 轮询 / WebSocket | ✓ | ✓ | 不需要同步绕过 |
| S17 Toast | ✓ | ✓ | |
| S18 错误与重试 | ✓ | ✓ | 0.8.0 的等待（#67）已去掉；未开启 `native-module` tracker |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | |
| S21 深链接 | ✓ | ✓ | 热启动：后台时 `openUrl()`；冷启动：`terminate()` + `relaunch({ url })` |
| **S22 本地通知** | **✗（5 轮中 1 次失败）** | ✓ | `openNotification`，默认超时。**iOS 第 1 轮失败（#82）**：runner 冷启动 11.8 s（其他轮 7.7–8.3 s）错过横幅 → 通知中心；iOS 27 上点击只侧滑露出 “Open”（约 3.1 s 后收回），Quiesco 等 3 s 后才找 “Open”，点击落在收回之后。通知权限不能预先授予，依赖本模拟器已授予的状态（0.10.0 诊断版前模拟器设置被重建、授权丢失，用一次性测试恢复，见 SETUP-LOG） |
| S23 前后台 | ✓ | ✓ | |

### 诊断版（不加任何等待）

| 平台 | 结果 | 失败 |
|---|---|---|
| iOS | 24 / 24 | （第 1 次 23 / 24：S22，模拟器的通知授权丢失，属环境；恢复后重跑） |
| Android | 23 / 24 | S6（超过 Vitest 默认的 120 s 单测超时；`scrollTo` 未卡住，每步约 3.7 s） |

0.7.0 时为 iOS 20 / 24、Android 21 / 24；0.8.0 时为 iOS 22 / 24、Android 23 / 24；0.9.0 时为 iOS 23 / 24、Android 22 / 24。

### 连续 5 轮（正式版，每轮前重启模拟器）

2026-11-20：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 23、24、24、24、24 / 24 | 366、343、341、348、342 s | 第 1 轮 S22（#82） |
| Android | 24、24、24、24、24 / 24 | 268、235、235、228、230 s | — |

## 2. 能力检查 C1–C11（0.10.0）

`e2e/capability/`。各项至少 1 次通过。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | ✓ | ✓ | `biometrics.enroll()` / `fail()` / `match()`；“取消”用 `system.tap`。**iOS 在整套能力检查中失败**（0.10.0：1 次中 1 次，`system.tap` 读不到 Face ID 对话框中的 “Cancel”；0.9.0：3 次中 2 次，其中一次是点击丢失，即 #87），单独运行 2 / 2 通过 |
| C2 跨 app 登录 | ✓ | ✓（GAPIS） | iOS：确认框 `system.tap({ text: 'Continue' })`，认证页面经 `system.type`。Android：Custom Tab 中 `system.type`（AOSP 镜像上经 WebView shell 也通过，不作为结果） |
| C3 分享面板 | ✓ | ✓ | iOS：`system.expectVisible({ text: 'Copy' })` 后 `system.tapAt` 点面板外关闭。0.9.0 时 iOS 整套中 3 次里失败 1 次（点击后面板未关闭，#87），0.10.0 整套中通过。Android：`system.expectVisible` 后 `pressBack()` |
| C4 选择器 | ✓ | ✓ | `{ id: 'dup-row', index: 2 }`；`{ label: 'Secret button' }` |
| C5 嵌套滚动 | ✓ | ✓ | `scrollTo('carousel', 'carousel-slide-6')` |
| C6 启动阶段 | ✓ | ✓ | 冷启动后直接 `type()` |
| C7 远程图片 | ✓ | ✓ | |
| C8 深色模式 | ✓ | ✓ | `setAppearance()` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation()` |
| C10 系统语言 | ✓（需额外说明） | ✓（需额外说明） | `setLocale()`。iOS：以 `-AppleLanguages` 重新启动（`Intl` 与原生字符串仍为 bundle 的语言）。Android：per-app language，不是改系统语言 |
| C11 远程推送 | ✓ | ✗ | iOS：`push-ios.sh`（`simctl push`）+ `openNotification()`。Android：模拟器没有推送服务，与其他工具同为 ✗ |

## 3. 各版本的比较

| 项 | 0.7.0 | 0.8.0 | 0.9.0 | 0.10.0 |
|---|---|---|---|---|
| 等待（WAITS） | iOS W2×1 / W3×1；Android W2×2 / W3×1 | iOS W3×3；Android W3×3 / X×1 | iOS W3×1；Android W3×2 | 同 0.9.0（代码中 W3×2，两平台都执行） |
| 外部命令 / 额外配置 | S8 Android、S21、C2 Android、C10 iOS（app 侧）、构建脚本 | S7b iOS 键盘登记、构建脚本 | S7b iOS 键盘登记、Gradle 内存 | 同 0.9.0 |
| 能力检查 | iOS C2 ✗、C3 ✗、S7b ✗ 等 | iOS 全部 ✓；Android C11 ✗ | 同 0.8.0（iOS C1 / C3 偶发失败） | Android 同 0.9.0；iOS C1 整套中失败（单独 ✓）、S7b 未通过（环境） |
| 连续 5 轮 | 两平台 5 × 24 / 24 | iOS 3 / 5（S22）、Android 3 / 5（S6） | 两平台 0 / 5（S12 每轮，#74）；其余 23 场景 5 / 5 | iOS 4 / 5（S22，#82）；**Android 5 / 5** |

## 4. 未解决的问题

- **S22 iOS**（#82）：runner 冷启动慢于约 10–11 s 时错过横幅，走通知中心路径即失败。Quiesco 修复前 iOS 无法保证 5 轮全绿。
- **S7b iOS**：0.10.0 中因模拟器环境未能复测（见上表）。
- **S6 Android**：耗时波动大（正式版 35–54 s；长时间运行的模拟器上或同时录屏时超过 120 s），原因未定。正式版有 300 s 单测超时（W3）。
- **C1 iOS**：整套能力检查中失败、单独通过。系统 UI 呈现动画未结束时的点击问题提交为 #87。
- 被测试框架超时中断的 `scrollTo` 不留下每一步的记录（#84）；`quiesco doctor` 的 scripts 检查误报（#83）；iOS 超时报错不列系统弹窗（#85）；清理残留通知权限弹窗时点“拒绝”（#86）。

## 5. 出处

- 插件内的官方文档副本：`~/.claude/plugins/cache/h2nology/quiesco/0.10.0/skills/*/references/*.md`（2026-11-20）；0.8.0 / 0.9.0 / 0.10.0 release notes
- 工具缺陷的根因：`@quiesco/agent` / `@quiesco/core` 0.8.0 / 0.9.0 / 0.10.0 的源码，见 findings.md（由插件的 `failure-investigator` 读证据与源码，并经执行者核对）
- 其余结论均为本仓库实测，测试代码见 `e2e/final`、`e2e/capability`
