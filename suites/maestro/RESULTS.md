# Maestro：接入结果（M3）

- 版本：Maestro CLI 2.11.0（Java 17）
- 设备：iPhone 17 / iOS 27.0 模拟器；Android `Medium_Phone_API_36_AOSP`（C2 在 `Medium_Phone_API_36_GAPIS`，METHODOLOGY v3）
- 构建：Release，不带任何工具叠加（`E2E_TOOL=none`，`build.sh`，与 Appium 相同）。**Maestro 不需要改 app**
- 重置：见 METHODOLOGY 5 的表。Android 用官方 `launchApp clearState`；iOS 的 `clearState` 会重装 app，用外部命令补齐（`scripts/device-helper.mjs`）
- 运行：`PLATFORM=ios|android VARIANT=diagnostic|final ./run.sh [flow …]`（负责安装 app、Android `adb reverse`、启动 device-helper、输出 JUnit）
- 接入过程与坑：见 [SETUP-LOG.md](SETUP-LOG.md)；等待与同步绕过：见 [WAITS.md](WAITS.md)

图例：✓ 通过；✗ 做不到（附原因）；需额外配置 = 需要 Maestro 命令以外的外部命令或额外处理；需额外说明 = 用了与场景描述不同的方式。

## 1. 场景 S1–S23（正式版）

| 场景 | iOS | Android | 说明 |
|---|---|---|---|
| S1 登录 | ✓ | ✓ | Android 需 W3：重置后 `waitForAnimationToEnd`，否则启动中的点击会使之后所有注入的触摸失效（WAITS #1） |
| S2 邮箱校验 | ✓ | ✓ | |
| S3 搜索 | ✓ | ✓ | `inputText` 对 ASCII 文字逐个按键输入；之后 `hideKeyboard`（键盘挡住 `#item-row-49`，`assertVisible` 要求可见） |
| S4 新增 | ✓ | ✓ | |
| S5 删除 | ✓ | ✓ | |
| S6 长列表 | ✓ | ✓ | `scrollUntilVisible`，timeout 调为 300 s（WAITS #2）。iOS 约 180 s、Android 约 190 s。`speed: 100` 会惯性越过目标行 |
| S7a 中日文（文本 API） | ✓ | ✓ | iOS：XCTest `typeText`。Android：含非 ASCII 字符时 Maestro 切换到自己的输入法一次性写入（2.7.0 起支持） |
| S7b 中日文（经由输入法） | 需额外配置 | ✗ | iOS：外部命令（device-helper → `simctl … defaults write -g AppleKeyboards`）登记拼音和日文罗马字键盘，之后按键（`tapOn` 键帽文字）、选词（`tapOn: "测试,.*"`，候选 Cell 的 label）、切换键盘（`Next keyboard`）都用 Maestro 完成，连续 3 次通过（`flows/capability/s07b-ime.yaml`）。Android：AOSP 镜像只有 LatinIME，没有中日文输入法（与工具无关） |
| S8 原生控件 | ✓ | ✓ | 滑块：`swipe` 的 `start` / `end` 只能写屏幕坐标且不能用变量 → 按平台写死屏幕百分比（需额外说明）。日期：iOS `tapOn: .*December 25.*` + 完成；Android 按文字 `25` + `OK` |
| S9 WebView | ✓ | ✓ | 网页内容在无障碍树中，按文字定位。iOS 需 W2：按钮出现时网页尚不可交互，偶发点击无效；Maestro 文档推荐的 `retryTapIfNoChange` 不可靠（WebView 内容仍在变化，被判为“已变化”不重试）→ `repeat while` 手写重试（WAITS #3） |
| S10a 预先授权 | ✓ | ✓ | `setPermissions`。iOS 的定位权限取值为 `inuse`（`allow` 报错），按平台分支 |
| S10b 点击系统权限弹窗 | ✓ | ✓ | `tapOn: Allow While Using App`；Android 按钮为全大写，按 resource-id 定位。Appium 在 iOS 上需要的 W2（弹窗刚出现时的点击被忽略）在 Maestro 中不需要 |
| S11 无限动画 | ✓ | ✓ | 无同步绕过。每步都等“界面静止”到上限，Android 约 50 s（其他场景 20–30 s） |
| S12 左滑删除 | ✓ | ✓ | `swipe from: {id: item-row-1} direction: LEFT` |
| S13 下拉刷新 | ✓ | ✓ | `runScript`（`http.post`）新增数据后 `swipe from: {id: item-list} direction: DOWN` |
| S14 长按 / 拖拽 | ✓ | ✓ | `longPressOn`（3 秒）。拖拽：没有“拖到某元素”的命令，从 R5 的手柄 `swipe direction: UP`（终点为屏幕 10% 高度，越过 R1，需额外说明） |
| S15 Reanimated | ✓ | ✓ | |
| S16 轮询 / WebSocket | ✓ | ✓ | 无同步绕过。Android 每步等“界面静止”到上限，约 90 s |
| S17 Toast | ✓ | ✓ | `assertVisible` 后 `assertNotVisible` |
| S18 错误与重试 | ✓ | ✓ | Appium 在 iOS 上需要的“等首次加载完成”（W3）在 Maestro 中不需要 |
| S19 Tab 状态 | ✓ | ✓ | “返回”：Android `back`；iOS 点导航栏的 `Back`（Maestro 的 `back` 只支持 Android / Web） |
| S20 键盘遮挡 | ✓ | ✓ | 两平台都用 `hideKeyboard`（iOS 为在屏幕中间小幅滑动，Android 为返回键） |
| S21 深链接 | ✓ | ✓ | 切后台 `pressKey: home`，`openLink`，终止 `stopApp`。iOS 的“Open in "rnshootout"?”确认框：点过一次后该模拟器不再出现（Maestro 文档），出现时才点 |
| S22 本地通知 | 需额外说明 | ✓ | 打开通知中心：从屏幕顶端向下 `swipe`（两平台相同）。通知权限：`setPermissions: { notifications: allow }`（Maestro 文档：iOS 不能静默授予，系统弹窗出现时 Maestro 自动点 Allow）。iOS：同 app 的通知被折叠为组，先展开；对通知卡片的点击被识别为横向滑动（与 Appium 相同）→ 右滑卡片后点 `Open` |
| S23 前后台 | ✓ | ✓ | 切后台 `pressKey: home`，回前台 `launchApp: { stopApp: false }`，终止 `stopApp`。“后台停留 2 秒”：Maestro 没有固定时长的等待命令，用 device-helper 的 `/sleep`。Appium 需要的“等保存请求完成”（W3）在 Maestro 中不需要（`tapOn` 后等待界面静止） |

### 诊断版（不加任何等待）

| 平台 | 结果 | 失败原因 |
|---|---|---|
| iOS | 22 / 24 | S6（`scrollUntilVisible` 默认 20 s 超时）、S9（WebView 内按钮点击过早，偶发）。另有 3 项（S10a、S21、S22）为写法问题，已在两版同时修正 |
| Android | 22 / 24（正常时） | S6（同上）；另有启动中的点击使之后全部触摸失效的问题（WAITS #1），一旦发生，本轮其余场景全部失败（全套 3 次中 2 次发生，分别为 8 / 24、7 / 24） |

### 连续 5 轮（正式版）

2026-11-18 执行，每轮前重启模拟器（METHODOLOGY 6.4）。S10a / S10b 各为一个 flow，共 24 个。下表为最终代码的结果（iOS 5 轮后，Android 用同一份代码重跑 5 轮）：

| 平台 | 轮次 | 每轮结果 | 每轮耗时 |
|---|---|---|---|
| iOS | 5 | 24 / 24 flow 通过（全部场景） | 9 分 46 秒 – 9 分 51 秒 |
| Android | 5 | 24 / 24 flow 通过（全部场景） | 13 分 11 秒 – 14 分 29 秒 |

耗时为 Maestro 报告的套件耗时，含重置（每个 flow 的 `onFlowStart`），仅供参考，正式测量由 harness 进行（M4–M5）。

达到上表之前的尝试（不计入，但如实记录；METHODOLOGY 6.1 不重试）：

| 尝试 | 结果 | 处理 |
|---|---|---|
| Android 第 1 次（WAITS #1 之前） | 第 1 轮 6 / 24：重启后第一个场景就发生“启动中的点击使之后所有触摸失效” | 中止，查明根因后加 WAITS #1 |
| Android 第 2 次 | 5 × 24 / 24 | 当时 S9 为 `retryTapIfNoChange` 版，S9 改动后用最终代码重跑（即上表） |
| iOS 第 1 次 | 第 1 轮 23 / 24（S9：`retryTapIfNoChange` 未重试）；第 2 轮 1 / 24：S3 中 Maestro 的 iOS 驱动截图超时（`Timed out while requesting screenshot`），约 6.5 分钟后 XCTest runner 重启，Maestro 没有恢复会话，其余 23 个 flow 在 1 秒内全部失败 | 中止。S9 改为 W2；驱动崩溃原因不明，之后 5 轮未再出现 |

## 2. 能力检查 C1–C11

`flows/capability/`（C10 Android 由 `scripts/c10-android.sh` 运行）。iOS 各项至少 1 次通过，C1、C3 修正后 3 次通过；Android C1、C2 各 3 次通过，其余至少 1 次。

| 项 | iOS | Android | 说明 |
|---|---|---|---|
| C1 生物识别 | 需额外配置 | 需额外配置 | Maestro 没有生物识别命令，全部经 device-helper 执行外部命令。iOS：`simctl spawn … notifyutil`（登记 Face ID、`pearl.match` / `pearl.nomatch`）；失败后系统弹窗的 `Cancel` 按文字找不到，按 id `com.apple.localauthentication.ax.authentication.button.cancel` 可以点击。Android：模拟器要先设置 PIN 并在设置 app 中登记指纹（`adb shell locksettings set-pin` + 登记流程），再用 `adb emu finger touch 1 / 2`；失败后点系统弹窗的取消（resource-id `button_negative`）。Appium iOS 需要的两处等待在 Maestro 中都不需要 |
| C2 跨 app 登录 | ✓ | ✓ | iOS：ASWebAuthenticationSession 的确认框（`Continue`）与网页里的输入框、按钮都能按文字操作。Android（GAPIS）：Chrome Custom Tab 的页面同样可以按文字操作 |
| C3 分享面板 | ✓ | ✓ | iOS 27 的面板没有关闭按钮，点面板外空白处（`tapOn: point`，屏幕坐标）。点在导航栏上（15% 高度）不会关闭，改为 45% 处后连续 3 次通过，不需要等待（Appium 需要 W2）。Android：等面板出现后 `back` |
| C4 选择器 | ✓ | ✓ | `tapOn: { id: dup-row, index: 2 }`；`tapOn: Secret button`（文字选择器也匹配 accessibility label） |
| C5 嵌套滚动 | ✓ | ✓ | 先 `scrollUntilVisible` 纵向找到轮播，再 `repeat while notVisible carousel-slide-6` → `swipe from: {id: carousel} direction: LEFT`（`scrollUntilVisible` 从屏幕中央滑动，不能指定在哪个容器内滑） |
| C6 启动阶段 | ✓ | ✓（需 W3） | 冷启动后直接 `tapOn`，不加固定等待。Android 依赖正式版重置中的 `waitForAnimationToEnd`（WAITS #1）：没有它时，启动中的点击可能让之后所有触摸失效 |
| C7 远程图片 | ✓ | ✓ | `assertVisible` 的隐式等待即可 |
| C8 深色模式 | ✓ | ✓ | `setDarkMode: enabled / disabled` |
| C9 横竖屏 | ✓ | ✓ | `setOrientation: LANDSCAPE_LEFT / PORTRAIT` |
| C10 系统语言 | ✓ | 需额外配置 | iOS：`launchApp` 的 `arguments`（`AppleLanguages: (ja)`、`AppleLocale: ja_JP`，只改本 app）。Android：Maestro 只能在 `maestro start-device --device-locale` 新建设备时设置语言，`maestro test` 中不能改（官方文档）→ flow 外用外部命令（root + `persist.sys.locale` + 重启 zygote）切换现有模拟器的系统语言，再各跑一个只做断言的 flow |
| C11 远程推送 | 需额外配置 | ✗ | iOS：推送由场景规定的 mock server 辅助脚本 `push-ios.sh`（`simctl push`）发出，flow 内经 device-helper 调用；横幅可以按文字点击。Android：模拟器上没有 FCM 投递方式（各工具共通） |

C1、C10 Android、C11 iOS 的“需额外配置”来自同一个结构性限制：flow 内不能执行 shell 命令（`runScript` 是沙箱 JS，只能发 HTTP），工具没有的能力只能借助外部 HTTP 小服务或在 flow 外执行。Appium 的同类操作大多有对应的 `mobile:` 命令。

## 3. 出处

- Maestro 文档（命令参考、权限、JavaScript / HTTP、Hooks、报告、Cloud 的自动重试）：https://docs.maestro.dev/ （2026-11-18 访问，`llms-full.txt` 与各命令页的 Markdown 版）
- 其余结论均为本仓库实测，flow 见 `flows/final`、`flows/capability`
