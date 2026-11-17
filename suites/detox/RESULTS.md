# Detox：接入结果（M3）

- 版本：detox 20.51.4、expo-detox-config-plugin 13.1.0、jest 29.7.0
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release（iOS `ios.sim.release`，Android `android.att.release`）
- 重置：见 METHODOLOGY 5 的表。Detox 只有卸载重装（`delete: true`），按规则改用外部命令只清数据（SETUP-LOG 第 9 步）
- 等待与同步绕过：见 [WAITS.md](WAITS.md)
- 前提：Detox 官方支持 RN 0.77–0.84，本项目为 RN 0.88（Expo SDK 58），不在官方支持范围内。以下 ✗ 中，标注“RN 0.88”的项可能在官方支持的 RN 版本上不出现。

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Detox API 以外的外部命令或额外处理；需额外说明 = 用了与场景描述不同的方式。

## 1. 场景 S1–S23（正式版）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | Android 需 W3（不等待防抖定时器），WAITS #7 |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | 用 `whileElement().scroll()`；每步滚动都等待空闲，约 120 s，单测超时调为 300 s（WAITS #6） |
| S7a 中日文（文本 API） | ✓ | ✓ | Android `typeText` 会在末尾多一个空格的现象见 findings（S7a 用 `replaceText`） |
| S7b 中日文（经由输入法） | ✗ | ✗ | Detox 没有操作系统输入法的 API |
| S8 原生控件 | ✓ | ✓ | 滑块：`adjustSliderToPosition` 在 Fabric 下不触发 `onValueChange`，两个平台都改用 `swipe`。Android 日期：Detox 无日期选择器 API，日期格子不是独立 View，以 OK 按钮为基准按坐标点击（依赖设备尺寸，较脆弱） |
| S9 WebView | ✓ | ✓ | |
| S10a 预先授权 | ✓ | 需额外配置 | Android：`launchApp` 的 `permissions` 只对 iOS 有效，用 `adb shell pm grant` |
| S10b 点击系统权限弹窗 | ✓ | ✗ | Android：Espresso 只能操作 app 进程内的视图，Detox 不提供 UiAutomator 级的系统 UI 操作 |
| S11 无限动画 | ✓ | ✓ | 需 X：同步永不空闲，进入页面前关闭同步（WAITS #1–#3） |
| S12 左滑删除 | ✓ | ✓ | |
| S13 下拉刷新 | ✓ | ✓ | |
| S14 长按 / 拖拽 | ✓ | ✓ | |
| S15 Reanimated | ✓ | ✓ | Android 需 W3（不等待 UI 线程动画），WAITS #8 |
| S16 轮询 / WebSocket | ✓ | ✓ | |
| S17 Toast | ✓ | ✓ | 需 W3（2 秒定时器超出跟踪阈值），WAITS #4 |
| S18 错误与重试 | ✓ | ✓ | |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | Android 需 W1（键盘收起后的布局调整不被等待），WAITS #9 |
| S21 深链接 | ✗ | ✓ | iOS 冷启动：`launchApp({ newInstance: true, url })` 在 RN 0.88（SceneDelegate）下不把 URL 交给 app，5 轮均在同一步失败（RN 0.88）。热启动用外部命令 `simctl openurl` 可通过（Detox 自带的 `openURL` 同样不生效）。Android 热启动用 `adb am start` |
| S22 本地通知 | ✗ | ✗ | 必须从系统通知中心点击。iOS：`system` API 只覆盖系统弹窗，横幅可以显示但查找不到（C11 中实测）；Android：Espresso 无法操作通知栏 |
| S23 前后台 | ✓ | ✓ | |

### 连续 5 轮（正式版）

待重跑结果（重置方式改正后）。改正前的一轮（卸载重装方式）：iOS 5 轮均为 22 通过 / 1 跳过（S22）/ 1 失败（S21 冷启动，均在同一行），Android 5 轮均为 22 通过 / 2 跳过（S10b、S22）。

## 2. 能力检查 C1–C11

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | 需额外配置 | ✗ | iOS：Detox 的 `unmatchFace()` / `matchFace()` 在 Face ID 弹窗显示时卡在 `waitForActive`（app 处于 inactive，5 分钟超时），改用外部命令 `simctl spawn … notifyutil -p com.apple.BiometricKit_Sim.pearl.(no)match` 发同样的信号后通过；取消按钮用 `system` API 点击。Android：Detox 没有指纹 / 生物识别 API |
| C2 跨 app 登录 | ✗ | ✗ | 登录页在 app 进程外。iOS：ASWebAuthenticationSession，`system` API 能点“Continue”，但 `web` API 找不到页面（只支持 app 内 WebView）。Android（GAPIS）：页面在 Chrome 的 `CustomTabActivity`，Espresso 报 “No activities in stage RESUMED”；且 Custom Tab 打开期间 tap 等待空闲超时，需关闭同步 |
| C3 分享面板 | ✓ | ✓（需 X） | iOS 点击面板外区域关闭。Android：面板打开期间 Fabric UI 不空闲，tap 等待超时，需关闭同步 + `pressBack` |
| C4 选择器 | ✓ | ✓ | `atIndex(2)`、`by.label()` |
| C5 嵌套滚动 | ✓ | ✓ | `whileElement(by.id('carousel')).scroll(200, 'right')` |
| C6 启动阶段 | ✓ | ✓ | 不加 sleep 直接输入 |
| C7 远程图片 | ✓（需 W3） | ✓（需 W3） | Detox 的同步不等待 expo-image 的网络加载，不加 `waitFor` 时失败 |
| C8 深色模式 | 需额外配置 | 需额外配置 | Detox 无切换外观的 API，用 `simctl ui appearance` / `adb shell cmd uimode night` |
| C9 横竖屏 | ✓ | 待验证 | `setOrientation`。当前文档只写明 iPad 上的限制，没有写不支持 Android；此前据“仅 iOS”跳过的依据不成立，需实测 |
| C10 系统语言 | ✓ | 需额外配置 | iOS：`launchApp({ languageAndLocale })`；按钮是 View，文字只暴露为 label，断言用 `toHaveLabel`。Android：Detox 无 API，用 `adb shell cmd locale set-app-locales` |
| C11 远程推送 | ✗ | ✗ | iOS：`push-ios.sh` 发出的横幅能显示，但 `system` API 找不到（每次查找约 20 秒，预热 XCUITest runner、试多种 label 均失败）；Detox 官方的 `sendUserNotification` 不进入目标页（RN 0.88 下与 S21 同样不生效）。Android：没有 FCM，无法从外部向 app 投递推送（各工具共通）；`sendUserNotification` 后台调用报 “No Activity found”，冷启动方式把数据放在 intent extras，需 app 侧代码读取，不允许为单个工具改 app |

待重跑结果（重置方式改正后）确认。

## 3. 出处

- Detox 支持的 RN 版本：https://wix.github.io/Detox/docs/introduction/environment-setup
- `setOrientation`：https://wix.github.io/Detox/docs/api/device#devicesetorientationorientation
- `system` API（iOS 系统弹窗）：https://wix.github.io/Detox/docs/api/system
- `sendUserNotification`：https://wix.github.io/Detox/docs/guide/mocking-user-notifications
- 其余结论均为本仓库实测，代码见 `e2e/final` 与 `e2e/capability`
