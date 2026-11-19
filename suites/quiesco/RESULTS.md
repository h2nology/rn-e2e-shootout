# Quiesco：接入结果（M3）

- 版本：quiesco / @quiesco/* **0.8.0**（METHODOLOGY v4；首次接入为 0.7.0，同日升级），Vitest 5.1.1
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，`E2E_TOOL=quiesco EXPO_PUBLIC_QUIESCO=1`（`build.sh`）
- **对 app 的改动**：`@quiesco/agent`、`@quiesco/native`、`@quiesco/expo-plugin` 依赖；`app.json` 的 config plugin；`metro.config.js`（`withQuiesco()`）；`index.ts` 入口（第一行 import agent）；根布局包 `<QuiescoRoot>`。非 e2e 构建中 plugin 把 native 模块排除出自动链接、metro 把 agent 换成空实现。0.7.0 时 C10 需要的 `CFBundleLocalizations` 在 0.8.0 中已去掉
- 重置：见 METHODOLOGY 5 的表（Quiesco 默认的 soft reset 粒度不同，另外用 `relaunch({ clearData: true })` 补齐；hook 放在 `setupFiles`）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)；工具问题：见 findings.md（h2nology/quiesco#44–#55 已在 0.8.0 关闭，#63–#68 为 0.8.0 中新发现）
- **披露**：接入使用了 Quiesco 官方的 Claude Code 插件（METHODOLOGY v4）；执行者代表 Quiesco 作者一方

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Quiesco API 以外的外部命令或对 app 的额外改动；需额外说明 = 用了与场景描述不同的方式。

## 0. 状态：**未达到 M3 完成标准**（连续 5 轮全绿）

用最终代码，iOS、Android 各 5 轮中都有 2 轮失败，失败都来自 Quiesco 0.8.0 本身（见第 1 节“连续 5 轮”）。按用户决定（2026-11-19）如实记录，等 Quiesco 修复后重跑。

## 1. 场景 S1–S23（正式版）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `type(…, { perCharacter: true })` 逐字输入 |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | 不稳定 | `scrollTo`（真实拖动直到目标中心露出），`timeoutMs` 放宽（W3）。Android：正常约 35 s，最终代码 5 轮中 2 轮卡住超过 300 s（列表在动但每步约 16 s，原因未定，见第 4 节）。`scrollToIndex` 是 app 内部方法，场景禁止 |
| S7a 中日文（文本 API） | ✓ | ✓ | `type()` |
| S7b 中日文（经由输入法） | ✓（能力检查） | ✗ | iOS：外部命令登记拼音 / 日文键盘后，按键与候选词经 `system.tap` 点击（0.8.0 起键盘在 `system.*` 中可见）。Android：AOSP 镜像没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 开关 `tap`；滑块 `adjustSlider`（真实拖动）；日期：两平台都 `system.tap({ text: '25' })`（iOS inline 日历、Android 日期对话框） |
| S9 WebView | ✓ | ✓ | `app.webview()` |
| S10a 预先授权 | ✓ | ✓ | `setPermission('location', 'grant')` |
| S10b 点击系统权限弹窗 | ✓ | ✓ | `system.tap`。Android：打开弹窗的那次点击 `{ sync: false }`（X，Quiesco 缺陷 #66） |
| S11 无限动画 | ✓ | ✓ | 不需要同步绕过 |
| S12 左滑删除 | ✓ | ✓ | |
| S13 下拉刷新 | ✓ | ✓ | |
| S14 长按 / 拖拽 | ✓ | ✓ | |
| S15 Reanimated | ✓ | ✓ | 不需要同步绕过 |
| S16 轮询 / WebSocket | ✓ | ✓ | 不需要同步绕过 |
| S17 Toast | ✓ | ✓ | |
| S18 错误与重试 | ✓ | ✓ | 登录后先等首次加载（W3，原生模块 Promise 不计入忙碌，#67；Appium 同样需要） |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | |
| S21 深链接 | ✓ | ✓ | 热启动：后台时 `openUrl()`；冷启动：`terminate()` + `relaunch({ url })` |
| S22 本地通知 | 不稳定 / 需额外说明 | ✓ | `openNotification`。iOS：`timeoutMs` 30 s（W3，#64）；仍有两种失败无法在测试中避开（#65 通知分组导致 runner 崩溃、#68 横幅自行消失被当作点击成功）。通知权限不能预先授予，依赖本模拟器已授予的状态 |
| S23 前后台 | ✓ | ✓ | |

### 诊断版（不加任何等待）

| 平台 | 结果 | 失败 |
|---|---|---|
| iOS | 22 / 24 | S6（`scrollTo` 整个调用 10 s 超时，#63）、S22（#65） |
| Android | 23 / 24 | S6（同上；误报 “to both ends”） |

0.7.0 时为 iOS 20 / 24、Android 21 / 24。

### 连续 5 轮（正式版，每轮前重启模拟器）

最终代码（WAITS #1–#5 全部在内），2026-11-19：

| 平台 | 每轮结果 | 每轮耗时（墙钟） | 失败 |
|---|---|---|---|
| iOS | 23、23、24、24、24 / 24 | 495、385、340、340、335 s | 第 1 轮 S22（#65：通知分组 → runner 崩溃，超过 120 s 单测超时）；第 2 轮 S22（#68：点击后 app 没有回到前台） |
| Android | 23、24、23、24、24 / 24 | 496、225、496、228、300 s | 第 1、3 轮 S6 超过 300 s 单测超时（第 5 轮通过但用了 98 s，正常约 35 s） |

此前的尝试（代码少于最终版，不计入，但如实记录；METHODOLOGY 6.1 不重试）：

| 尝试 | 结果 | 处理 |
|---|---|---|
| iOS 第 1 次（无 WAITS #3） | 23、24、24、24、24 | 第 1 轮 S22：计时包含 runner 启动（14.4 s）→ 加 #3（#64） |
| Android 第 1 次（无 WAITS #4、#5） | 24、24、24、23、23 | 第 4 轮 S10b（后台时空闲等待挂起 → #5，#66）；第 5 轮 S18（首次加载与注入错误的竞争 → #4，#67）。S6 五轮都约 35 s |

## 2. 能力检查 C1–C11（0.8.0）

`e2e/capability/`。各项至少 1 次通过。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | ✓ | ✓ | `biometrics.enroll()` / `fail()` / `match()`；“取消”用 `system.tap`。Android 的 PIN 与指纹登记由 Quiesco 自动完成并撤销 |
| C2 跨 app 登录 | ✓ | ✓（GAPIS） | iOS：确认框 `system.tap({ text: 'Continue' })`，认证页面经 `system.type` 输入（0.8.0 起 SafariViewService 可见）。Android：Custom Tab 中 `system.type`（不再需要 adb） |
| C3 分享面板 | ✓ | ✓ | iOS：`system.expectVisible({ text: 'Copy' })` 后 `system.tapAt` 点面板外关闭（屏幕上部点了不关闭，与 Maestro 相同）。Android：`system.expectVisible` 后 `pressBack()` |
| C4 选择器 | ✓ | ✓ | `{ id: 'dup-row', index: 2 }`；`{ label: 'Secret button' }` |
| C5 嵌套滚动 | ✓ | ✓ | `scrollTo('carousel', 'carousel-slide-6')`（横向列表向右 / 向左） |
| C6 启动阶段 | ✓ | ✓ | 冷启动后直接 `type()` |
| C7 远程图片 | ✓ | ✓ | |
| C8 深色模式 | ✓ | ✓ | `setAppearance()` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation()` |
| C10 系统语言 | ✓（需额外说明） | ✓（需额外说明） | `setLocale()`。iOS：以 `-AppleLanguages` 重新启动，不再要求 `CFBundleLocalizations`（输出警告：`Intl` 与原生字符串仍为 bundle 的语言）。Android：per-app language，不是改系统语言 |
| C11 远程推送 | ✓ | ✗ | iOS：`push-ios.sh`（`simctl push`）+ `openNotification()`。Android：模拟器没有推送服务，与其他工具同为 ✗ |

0.7.0 时 iOS C2 ✗、C3 ✗、C5 需额外说明、C10 需额外配置，Android C2 需额外配置、C5 需额外说明，S7b iOS ✗；0.8.0 都改为 ✓。

## 3. 与 0.7.0 的比较

| 项 | 0.7.0 | 0.8.0 |
|---|---|---|
| 等待（WAITS） | iOS W2×1 / W3×1；Android W2×2 / W3×1；X 0 | iOS W3×3；Android W3×3 / X×1；W2 0 |
| 外部命令 / 额外配置 | S8 Android、S21、C2 Android、C10 iOS（app 侧） | 只有 S7b iOS 的键盘登记（场景前置条件） |
| 连续 5 轮 | 两平台 5 × 24 / 24 | 两平台都未达到（见上） |

## 4. 未解决的问题

- **S22 iOS**（#65、#68）：0.8.0 把打开通知中心的时机改为 2 s 后，通知进入通知中心中已有的同 app 分组，或横幅收起时的点击落空。模拟器的通知中心里积累着各工具各轮留下的通知（重启不清除）；其他三个工具都在这一环境下运行，因此没有为 Quiesco 单独清空。
- **S6 Android**：最终代码 5 轮中 2 轮卡住。列表确实在动（约 37 步中的 18 步），每步约 16 s（正常 0.67 s）；React 调度任务数是正常运行的约 6.5 倍，其他测试速度正常。`scrollTo` 的 `timeoutMs`（300 s）与单测超时相同，Vitest 先结束了测试，Quiesco 没有机会报告忙碌的 tracker → 原因未定。下一次排查前应把 `timeoutMs` 设得短于单测超时。第 1 次 5 轮中没有出现。

## 5. 出处

- 插件内的官方文档副本：`~/.claude/plugins/cache/h2nology/quiesco/0.8.0/skills/*/references/*.md`（2026-11-19）；0.8.0 release notes
- 工具缺陷的根因：`@quiesco/agent` / `@quiesco/core` 0.8.0 的源码，见 findings.md（由插件的 `failure-investigator` 读证据与源码，并经执行者核对）
- 其余结论均为本仓库实测，测试代码见 `e2e/final`、`e2e/capability`
