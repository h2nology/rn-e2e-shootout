# Appium：接入结果（M3）

- 版本：appium 4.0.0、appium-xcuitest-driver 13.1.1（WebDriverAgent 17.0.2）、appium-uiautomator2-driver 9.2.1、WebdriverIO 10.2.0（mocha）
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，不带任何工具叠加（`E2E_TOOL=none`，`build.sh`）。**Appium 不需要改 app**
- 重置：见 METHODOLOGY 5 的表。全部用 Appium API（`mobile: clearApp` 等），不需要外部命令
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Appium / WebdriverIO API 以外的外部命令或额外处理；需额外说明 = 用了与场景描述不同的方式。

## 1. 场景 S1–S23（正式版）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | iOS 需 W3：默认输入速度下丢字符（WAITS #1） |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | Android：`setValue` 一次写入整段文字，被键盘挡住的结果行也看不到 → 改为 W3C 按键逐字输入 + `hideKeyboard()` |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | `scrollIntoView`；iOS 约 179 s，单测超时调为 300 s（WAITS #2、#3） |
| S7a 中日文（文本 API） | ✓ | ✓ | |
| S7b 中日文（经由输入法） | 需额外配置 | ✗ | iOS：用外部命令 `simctl … defaults write -g AppleKeyboards` 登记拼音和日文罗马字键盘（驱动的 `mobile: configureLocalization` 写入的值格式有误——`…;@hw=Automatic`——键盘不切换，实测），之后按键、选词（候选栏是可定位的 Cell）、切换键盘都用 Appium 完成，连续 3 次通过（`test/capability/s07b-ime.js`）。Android：AOSP 镜像只有 LatinIME，没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 滑块：W3C pointer 从滑钮拖到轨道 75% 处（按坐标计算）。日期：iOS 点 `label CONTAINS "December 25"` 后点完成；Android 日期格子可以按文字 `25` 定位（Detox 需按坐标点击） |
| S9 WebView | ✓ | ✓ | 不切换 WEBVIEW 上下文，网页内容在原生无障碍树中按文字定位。iOS：`click` 不触发网页的 click 事件，要用 `tap()`；需 W3 + W2（偶发点击无效，原因未查明，WAITS #4、#5） |
| S10a 预先授权 | ✓ | ✓ | iOS `mobile: simctl privacy grant`；Android `mobile: changePermissions` |
| S10b 点击系统权限弹窗 | ✓ | ✓ | XCUITest / UiAutomator2 都能操作系统弹窗。iOS 需 W2：弹窗刚出现时的点击被忽略（WAITS #6）。Android 按钮文字为全大写，按 resource-id 定位 |
| S11 无限动画 | ✓ | ✓ | Android 需 X：UiAutomator2 等待界面空闲，`waitForIdleTimeout: 0`（WAITS #7）。iOS 不需要 |
| S12 左滑删除 | ✓ | ✓ | iOS 需 W3（`$()` 不等待，WAITS #8） |
| S13 下拉刷新 | ✓ | ✓ | iOS 需 W3（WAITS #9） |
| S14 长按 / 拖拽 | ✓ | ✓ | `longPress()` + `dragAndDrop()` |
| S15 Reanimated | ✓ | ✓ | |
| S16 轮询 / WebSocket | ✓ | ✓ | Android 需 X（同 S11，WAITS #10） |
| S17 Toast | ✓ | ✓ | |
| S18 错误与重试 | ✓ | ✓ | iOS 需 W3：Appium 不等待 app 的网络请求（WAITS #11） |
| S19 Tab 状态 | ✓ | ✓ | |
| S20 键盘遮挡 | ✓ | ✓ | iOS 用 `addValue('\n')` 收起键盘，Android 用 `hideKeyboard()` |
| S21 深链接 | ✓ | ✓ | `driver.deepLink()`（`mobile: deepLink`）。Appium 的会话独立于 app 进程，冷启动（先 `terminateApp`）同样可用（Detox iOS 冷启动 ✗） |
| S22 本地通知 | 需额外说明 | ✓ | 从系统通知中心点击。iOS：① 通知权限要在会话开始时设置（`reloadSession` 带 `appium:permissions`；会话中途 `mobile: setPermission` 会使 WebDriverAgent 断开）；② 之前的通知不随 app 数据清除，同 app 的通知被折叠为组，先展开；③ 对通知卡片的 `click` / `tap()` 被识别成横向滑动，app 不打开 → 右滑卡片露出 “Open” 再点。Android：`openNotifications()` 后按文字点击 |
| S23 前后台 | ✓ | ✓ | 需 W3：Appium 不跟踪网络请求，立刻结束 app 会切断保存请求（WAITS #14） |

### 诊断版（不加任何等待）

| 平台 | 结果 | 失败原因 |
|---|---|---|
| iOS | 2 / 24 | 默认输入速度下登录框丢字符，依赖登录的场景全部失败（只把 `maxTypingFrequency` 调到 20 时 7 / 24，仍不可靠） |
| Android | 17 / 24 | 真实失败：S6（60 s 超时）、S11 / S16（UiAutomator2 等待界面空闲，命令卡到超时）、S23（保存请求被结束 app 切断）。其余 3 项为脚本写法问题，已在两版同时修正 |

### 连续 5 轮（正式版）

2026-11-18 执行，按 iOS 5 轮 → Android 5 轮顺序。S7a 与 S10a / S10b 在同一 spec 文件中，以下按 spec 文件计（23 个）：

| 平台 | 轮次 | 每轮结果 | 每轮耗时 |
|---|---|---|---|
| iOS | 5 | 23 / 23 spec 通过（全部场景） | 530–542 s |
| Android | 5 | 23 / 23 spec 通过（全部场景） | 368–519 s |

两个平台 5 轮全绿，没有偶发失败。耗时含 Appium 会话启动与重置（每个 spec 文件新建一次会话），仅供参考，正式测量由 harness 进行（M4–M5）。

## 2. 能力检查 C1–C11

`test/capability/c-all.js`。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | ✓（需 W2） | 需额外配置 | iOS：`mobile: enrollBiometric` / `mobile: sendBiometricMatch`；Face ID 界面出现前发送的信号被忽略（W3 等界面出现）；失败后弹窗的 “Cancel” 刚出现时点击被忽略（W2，同 S10b）。Android：`driver.fingerPrint()` 可用，但模拟器要先设置 PIN 并登记指纹（外部命令 `adb shell locksettings set-pin` + 在设置 app 中登记，`adb emu finger touch`）；失败后同样要点系统弹窗的取消 |
| C2 跨 app 登录 | ✓ | ✓ | iOS：ASWebAuthenticationSession 的确认框与页面内的输入框、按钮都在 XCUITest 的无障碍树中，直接操作。Android（GAPIS）：Chrome Custom Tab 的页面内容同样可按原生元素操作 |
| C3 分享面板 | ✓（需 W2） | ✓ | iOS 27 的面板没有关闭按钮，点面板外空白区域；面板出现后约 3 秒内的点击被忽略（立刻点 0/3，3 秒后 3/3）→ W2。Android：面板（`com.android.intentresolver`）出现后 `back()` |
| C4 选择器 | ✓ | ✓ | `$$(…)[2]`；`~Secret button`（accessibility id 匹配 label / content-desc） |
| C5 嵌套滚动 | ✓ | ✓ | `scrollIntoView({ scrollableElement: carousel, direction: 'left' })` |
| C6 启动阶段 | ✓ | ✓ | 不加 sleep；iOS 输入用 `typeText`（WAITS #1） |
| C7 远程图片 | ✓ | ✓ | `expect().toHaveText('Loaded')` 的隐式等待即可，不需要额外等待 |
| C8 深色模式 | ✓ | ✓ | iOS `mobile: setAppearance`；Android `mobile: setUiMode` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation()` |
| C10 系统语言 | ✓ | ✓ | iOS：`appium:language` / `locale` capability 会重启 SpringBoard 等系统服务，之后 WebDriverAgent 断开（实测）→ 改用 `mobile: launchApp` 的启动参数 `-AppleLanguages` / `-AppleLocale`（只改本 app）。Android：`reloadSession` 带 `appium:language` / `locale` |
| C11 远程推送 | ✓ | ✗ | iOS：推送由场景规定的 mock server 辅助脚本 `push-ios.sh`（`simctl push`）发出；app 在后台时横幅可以定位和点击，进入目标页（W3 等横幅出现，最多 10 s）。Android：模拟器上没有 FCM 投递方式（各工具共通） |

与 Detox 的差异主要来自架构：Appium 通过 XCUITest / UiAutomator2 从 app 进程外操作，因此系统 UI（权限弹窗、通知中心、分享面板、外部浏览器页面）都能操作；代价是不跟踪 app 的状态（输入、网络请求、渲染），需要在测试中自行等待，iOS 上系统 UI 刚出现时的点击还会被忽略。

## 3. 出处

- XCUITest 驱动 execute methods（`mobile: clearApp`、`simctl`、`sendBiometricMatch`、`setAppearance`、`configureLocalization`、`deepLink` 等）：https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/
- UiAutomator2 驱动 settings（`waitForIdleTimeout`）：https://github.com/appium/appium-uiautomator2-driver#settings-api
- WebdriverIO 移动端命令：`node_modules/webdriverio/build/commands/mobile/*.d.ts`（10.2.0）
- 其余结论均为本仓库实测，代码见 `test/final` 与 `test/capability`
