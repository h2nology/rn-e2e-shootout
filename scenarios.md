# 场景清单

> 状态：**v1**（2026-11-17 预注册 tag `methodology-v1`；当前方法版本 v3，tag `methodology-v3`；v3 仅补充 C1 的操作说明）。本文件的场景语义和通过标准不得修改；如需修改，新开方法版本并重跑所有工具。

本文件与工具无关，只用自然语言描述“做什么、验证什么、怎样才算通过”。四个工具的实现都必须符合这里的定义。

- **主套件**：S1–S23，计入速度和稳定性统计。
- **能力边界清单**：C1–C11，只记 ✓ / ✗ / 需额外配置，不计入速度和 flake 率。

---

## 0. 通用约定

### 0.1 界面语言与设备

- 模拟器 / 浏览器的系统语言为英语（`en-US`），app 界面默认显示英文。下文引号中的界面文字均为英文原文。
- C10 是唯一会改变系统语言的检查项。

### 0.2 测试数据（mock server `/reset` 之后的初始状态）

| 数据 | 内容 |
|---|---|
| 账号 | 邮箱 `user@example.com`，密码 `Passw0rd!` |
| 条目 | 500 条，id 为 1–500，标题为 `Item 001` … `Item 500`，按 id 升序排列 |
| 拖拽排序页 | 10 个元素，标签为 `R1` … `R10`，按此顺序排列 |
| 表单初始值 | 开关关闭，滑块为 0（取值只有 0 / 25 / 50 / 75 / 100），日期为 `2026-12-01` |
| 错误注入 | 无 |
| 延迟 | 每个请求固定 200 ms（施压条件 `slow-net` 下改为 500–2000 ms 随机） |

### 0.3 每个场景开始前的状态

按 `METHODOLOGY.md` 的统一重置规则：服务端调用 `/reset`；app 清除数据并冷启动（不重新安装）。因此每个场景开始时 app 都处于**未登录的登录页**。

### 0.4 “已登录”前置条件

标有“前置：已登录”的场景，先通过界面完成一次登录（输入账号密码并点 “Sign in”，等到列表页出现）。各工具可以把登录写成共用的辅助函数 / 子流程，但**必须走界面**，不允许用深链接、注入存储或调用 API 跳过登录。登录步骤的耗时计入该场景。

### 0.5 测试中调用 mock server

部分场景需要在测试步骤中调用 mock server 的测试接口（例：错误注入、服务端新增数据）。四个工具都可以用各自的方式发 HTTP 请求（JS 的 `fetch`、Maestro 的 `runScript` 等），这不算违规操作。

### 0.6 定位方式

除 C4 外，元素一律用 `testID` 定位（下文写作 `#xxx`）。断言文字时用元素的可见文字。

### 0.7 “列表第一行”的判定

各工具对“元素顺序”的断言能力差别很大，为了不让这一点干扰其他指标，列表页顶部有一个可见的标签 `#list-top-title`，内容为 `Top: <第一行的标题>`。下文“列表第一行显示 X”一律指 `#list-top-title` 显示 `Top: X`。

### 0.8 新增条目的 id

新增的条目 id 从 501 开始递增（`/reset` 后第一条新增为 501），行的 `testID` 为 `#item-row-501`。

---

## 1. 主套件

每个场景包含：前置条件、步骤、验证点、通过标准。未单独写通过标准的，以“所有验证点成立”为通过。

### S1 登录成功后进入列表（A1 + A2）

- **前置**：登录页。
- **步骤**：
  1. 在 `#login-email` 输入 `user@example.com`。
  2. 在 `#login-password` 输入 `Passw0rd!`。
  3. 点 `#login-submit`。
- **验证点**：列表页 `#item-list` 出现，`#item-row-1` 可见，文字为 `Item 001`，列表第一行显示 `Item 001`。

### S2 错误邮箱的校验提示（A1）

- **前置**：登录页。
- **步骤**：
  1. 在 `#login-email` 输入 `not-an-email`。
  2. 在 `#login-password` 输入 `Passw0rd!`。
  3. 点 `#login-submit`。
- **验证点**：`#login-email-error` 显示 `Invalid email`；页面仍停留在登录页（`#item-list` 不存在）。

### S3 防抖搜索（A3 + A2）

- **前置**：已登录。
- **步骤**：在 `#search-input` 输入 `Item 04`（逐字输入，不粘贴）。
- **验证点**：
  - `#search-count` 显示 `10 results`。
  - `#item-row-40` 和 `#item-row-49` 存在于结果中，`#item-row-1` 不存在。
- **说明**：app 端搜索有 300 ms 防抖，之后才向服务端请求。

### S4 新增条目并在刷新后保留（A6）

- **前置**：已登录。
- **步骤**：
  1. 点 `#add-item-button`，进入新增页。
  2. 在 `#new-item-title` 输入 `New task`，点 `#new-item-save`。
  3. 回到列表后，点 `#list-reload` 重新从服务端拉取。
- **验证点**：
  - 保存后列表第一行显示 `New task`（乐观更新）。
  - 重新拉取后第一行仍是 `New task`（服务端已保存）。

### S5 删除条目，确认 Modal（A4 + A6）

- **前置**：已登录。
- **步骤**：
  1. 点 `#item-delete-2`。
  2. 确认 Modal `#confirm-modal` 出现（带淡入动画）后，点 `#confirm-ok`。
- **验证点**：Modal 关闭，`#item-row-2` 不再存在，`#item-row-1` 和 `#item-row-3` 仍存在。

### S6 长列表滚动到第 400 行（A5）

- **前置**：已登录。
- **步骤**：在 `#item-list` 中滚动，直到 `#item-row-400` 出现，点击它。
- **验证点**：详情页 `#item-detail-title` 显示 `Item 400`。
- **通过标准**：必须通过滚动列表找到该行。不允许用深链接、搜索或直接调用 `scrollToIndex` 等 app 内部方法。

### S7 中文 / 日文输入（A7）

- **前置**：已登录，进入新增页（同 S4 的步骤 1）。
- **步骤**：
  1. 在 `#new-item-title` 输入 `测试标题 テスト`，点 `#new-item-save`。
  2. 点 `#item-row-501`，进入详情页。
- **验证点**：`#item-detail-title` 显示 `测试标题 テスト`。
- **通过标准分两档**：
  - **S7a**：通过工具的文本输入 API 写入（不经过输入法）即可。
  - **S7b**：必须经由软键盘 / 输入法输入（例：切换到中文拼音输入法输入 `ceshi biaoti` 并选词，再切换到日文输入法输入 `tesuto` 并转换）。做不到记为 ✗。

### S8 原生控件（A8）

- **前置**：已登录，切换到 Settings Tab，点 `#open-controls` 进入控件页。
- **步骤**：
  1. 打开开关 `#control-switch`。
  2. 把滑块 `#control-slider` 调到 75。
  3. 在日期选择器 `#control-date` 中选择 `2026-12-25`。
  4. 点 `#control-submit`。
- **验证点**：结果页 `#control-result` 显示 `switch=on slider=75 date=2026-12-25`。
- **通过标准**：
  - 必须通过界面操作控件（点击、拖动、选择），不允许直接设置值或调用 JS。
  - iOS 和 Android 的日期选择器交互不同，允许按平台分别写步骤，但验证点相同。
  - Web 上的日期控件为浏览器原生 `<input type="date">`。

### S9 WebView（A9）

- **前置**：已登录，切换到 Explore Tab，点 `#open-webview`。
- **步骤**：在 WebView 中，等页面内文字 `Web page ready` 出现后，点页面内的按钮 `Send to native`（HTML `id="send"`）。
- **验证点**：原生侧 `#webview-result` 显示 `Received: hello`。

### S10 系统权限弹窗（A10）

- **前置**：已登录，切换到 Settings Tab，点 `#open-permission`。
- **步骤**：点 `#request-location`，在系统弹窗中选择“允许”（iOS：`Allow While Using App`；Android：`While using the app`）。
- **验证点**：`#permission-status` 显示 `Granted`。
- **通过标准分两档**：
  - **S10a**：用工具的启动参数 / 配置预先授权，点 `#request-location` 后显示 `Granted` 即可。
  - **S10b**：系统弹窗真实出现，由测试点击“允许”。

### S11 永不静止的动画（A11）

- **前置**：已登录，切换到 Explore Tab，点 `#open-busy-animation`。该页面有一个无限循环的装饰动画。
- **步骤**：点 `#busy-tap`。
- **验证点**：`#busy-result` 显示 `Tapped 1`。
- **通过标准**：在工具默认超时内完成即通过。如需关闭同步机制或配置“忽略某些动画”，可以通过，但必须记录用了什么手段、改了几行（计入同步绕过数，见 `METHODOLOGY.md`）。

### S12 左滑删除（A12 + A6）

- **前置**：已登录。
- **步骤**：
  1. 在 `#item-row-1` 上向左滑动，直到 `#swipe-delete-1` 出现。
  2. 点 `#swipe-delete-1`。
- **验证点**：`#item-row-1` 不再存在，列表第一行变为 `Item 002`。
- **通过标准**：必须用工具的手势 / 滑动 API 真正触发滑动。`#swipe-delete-1` 在滑动前不可见；不允许绕过滑动直接点击它，也不允许调用 JS 回调。Web 上用指针拖动实现滑动。

### S13 下拉刷新（A12 + A2）

- **前置**：已登录。
- **步骤**：
  1. 调用 mock server `POST /test/items`，请求体 `{"title":"Server item"}`（服务端新增一条，排在最前）。
  2. 在 `#item-list` 顶部向下拉，触发刷新。
- **验证点**：列表第一行显示 `Server item`。
- **通过标准**：必须用下拉手势触发刷新，不允许点 `#list-reload` 代替。

### S14 长按菜单与拖拽排序（A12）

- **前置**：已登录。
- **步骤**：
  1. 长按 `#item-row-3`，在弹出的菜单中点 `#menu-pin`。
  2. 切换到 Explore Tab，点 `#open-reorder` 进入排序页。
  3. 按住 `#reorder-handle-R5`，拖到 `#reorder-row-R1` 的位置后松开。
- **验证点**：
  - 步骤 1 之后，列表第一行显示 `Item 003`。
  - 步骤 3 之后，`#reorder-summary` 显示 `R5,R1,R2,R3,R4,R6,R7,R8,R9,R10`。
- **通过标准**：长按和拖拽都必须用工具的手势 API 触发。

### S15 Reanimated 动画（A13）

- **前置**：已登录，切换到 Explore Tab，点 `#open-reanimated`。
- **步骤**：
  1. 点 `#rea-card`，卡片以 Reanimated 弹簧动画（UI 线程）展开。
  2. 展开后点卡片内的 `#rea-card-action`。
- **验证点**：`#rea-result` 显示 `Action done`。
- **通过标准**：同 S11，记录是否需要额外配置。

### S16 轮询与 WebSocket（A14）

- **前置**：已登录，切换到 Explore Tab，点 `#open-live`。该页面每 1 秒轮询一次服务端，并保持一条 WebSocket 连接（服务端每 500 ms 推送一条消息）。
- **步骤**：在 `#live-name` 输入 `Alice`，点 `#live-submit`。
- **验证点**：`#live-greeting` 显示 `Hello, Alice`。
- **通过标准**：同 S11，记录是否需要额外配置（例：忽略某些 URL、关闭同步）。

### S17 自动消失的 Toast（A15）

- **前置**：已登录，切换到 Settings Tab。
- **步骤**：点 `#settings-save`。
- **验证点**：
  1. Toast `#toast` 出现，文字为 `Saved`。
  2. 之后 `#toast` 消失。
- **通过标准**：必须在 Toast 显示的 2 秒内断言到它出现，再断言它消失。错过出现时机即为失败。Toast 显示时长固定 2 秒，不受 `jitter` 影响。

### S18 错误态与重试（A16 + A2）

- **前置**：已登录。
- **步骤**：
  1. 调用 mock server `POST /test/fail`，请求体 `{"route":"/items","status":500,"count":1}`（下一次 `/items` 请求返回 500，之后恢复正常）。
  2. 点 `#list-reload`。
  3. 错误页 `#error-view` 出现后，点 `#error-retry`。
- **验证点**：
  - 步骤 2 之后 `#error-view` 显示 `Something went wrong`。
  - 步骤 3 之后 `#item-row-1` 可见。

### S19 Tab 与嵌套导航（A17）

- **前置**：已登录。
- **步骤**：
  1. 切换到 Explore Tab（`#tab-explore`），点 `#explore-counter` 3 次。
  2. 点 `#open-explore-detail` 进入二级页面，确认 `#explore-detail-title` 显示 `Explore detail`。
  3. 执行“返回”操作。
  4. 切换到 Home Tab（`#tab-home`），再切回 Explore Tab。
- **验证点**：
  - 步骤 3 之后回到 Explore 根页面，`#explore-counter-value` 显示 `3`。
  - 步骤 4 之后 `#explore-counter-value` 仍显示 `3`。
- **“返回”的定义**：Android 用硬件返回键；iOS 点导航栏左上角的返回按钮；Web 用浏览器后退。

### S20 键盘遮挡（A18）

- **前置**：已登录，切换到 Settings Tab，点 `#open-long-form`。
- **步骤**：
  1. 在页面最下方的 `#form-notes` 输入 `note`（该输入框获得焦点时会被软键盘遮挡，页面依靠 `KeyboardAvoidingView` 上移）。
  2. 收起键盘。
  3. 点 `#form-submit`（位于 `#form-notes` 下方）。
- **验证点**：`#form-result` 显示 `Submitted: note`。
- **通过标准**：收起键盘的方式不限（工具的收起键盘 API、点击空白处、按回车），但要记录用了哪一种。

### S21 深链接（A19）

- **前置**：已登录。
- **步骤**：
  1. **热启动**：把 app 切到后台，打开 `rnshootout://item/123`。
  2. 验证后，终止 app 进程。
  3. **冷启动**：在 app 未运行的状态下打开 `rnshootout://item/77`。
- **验证点**：
  - 步骤 1 之后 `#item-detail-title` 显示 `Item 123`。
  - 步骤 3 之后 `#item-detail-title` 显示 `Item 077`。
- **通过标准**：两种情况都要通过。可以用工具自带的深链接 API，也可以用外部命令（`xcrun simctl openurl`、`adb shell am start`），但要记录用的是哪一种。Web 上为直接打开对应 URL（`/item/123`）。

### S22 本地通知（A20）

- **前置**：已登录，通知权限已预先授权（权限弹窗由 S10 测试），切换到 Settings Tab。
- **步骤**：
  1. 点 `#notify-in-3s`（3 秒后发出一条本地通知，标题 `Hello from rnshootout`）。
  2. 立即把 app 切到后台。
  3. 打开系统通知中心，点这条通知。
- **验证点**：app 回到前台，`#notification-target` 显示 `Opened from notification`。
- **通过标准**：必须从系统通知中心点击通知，不允许用深链接代替。工具无法操作通知中心则记为 ✗。

### S23 前后台切换与持久化（A23）

- **前置**：已登录，点 `#add-item-button` 进入新增页。
- **步骤**：
  1. 在 `#new-item-title` 输入 `Draft text`（不保存）。
  2. 把 app 切到后台，等 2 秒，再切回前台。
  3. 验证草稿后，把标题改为 `Persisted`，点 `#new-item-save`。
  4. 终止 app 进程，再重新启动 app。
- **验证点**：
  - 步骤 2 之后 `#new-item-title` 的内容仍为 `Draft text`。
  - 步骤 4 之后 app 保持登录状态，列表第一行显示 `Persisted`。
- **通过标准**：切后台、回前台、终止、重启都要通过工具的 API 或外部命令完成，记录所用方式。

---

## 2. 平台适用性

“跨平台复用率”只在适用（✓）的场景上计算。

| 场景 | iOS | Android | Web | 说明 |
|---|---|---|---|---|
| S1–S6、S8、S11 | ✓ | ✓ | ✓ | |
| S7a | ✓ | ✓ | ✓ | |
| S7b | ✓ | ✓ | — | Web 不涉及软键盘输入法 |
| S9 | ✓ | ✓ | — | WebView 是原生组件 |
| S10 | ✓ | ✓ | — | 系统权限弹窗 |
| S12 | ✓ | ✓ | ✓ | Web 上用指针拖动 |
| S13 | ✓ | ✓ | — | Web 不支持 `RefreshControl` |
| S14–S18 | ✓ | ✓ | ✓ | |
| S19 | ✓ | ✓ | ✓ | 返回方式按平台不同 |
| S20 | ✓ | ✓ | — | 软键盘遮挡 |
| S21 | ✓ | ✓ | ✓ | Web 上为直接打开 URL |
| S22 | ✓ | ✓ | — | 系统通知中心 |
| S23 | ✓ | ✓ | — | 前后台、杀进程 |

---

## 3. 能力边界清单

每项都要实测，不能只查文档。每个工具 × 平台记 ✓ / ✗ / 需额外配置（附说明）。

| # | 检查项 | 通过标准 | iOS | Android | Web |
|---|---|---|---|---|---|
| C1 | 生物识别（A21） | 在 Settings Tab 点 `#open-biometric` → `#biometric-unlock`。先模拟一次失败的验证，`#biometric-status` 显示 `Failed`（iOS 上匹配失败后系统会提示重试，此时点“取消”结束验证）；再模拟一次成功的验证，显示 `Unlocked` | ✓ | ✓ | — |
| C2 | 跨 app 登录（A22） | 点 `#oauth-login`，在 `expo-web-browser` 打开的页面中输入用户名 `oauth-user` 并提交，跳回 app 后 `#oauth-status` 显示 `Signed in as oauth-user` | ✓ | ✓ | ✓ |
| C3 | 系统分享面板（A22） | 点 `#share-button`，系统分享面板出现后将其关闭，回到 app，`#share-status` 显示 `Share dismissed` | ✓ | ✓ | — |
| C4 | 选择器（A24） | ① 在 `#dup-list` 中，所有行共用 `testID` `dup-row`，点第 3 个，`#dup-result` 显示 `Row 3`；② 只用 accessibility label `Secret button`（无 `testID`）定位并点击，`#a11y-result` 显示 `Found` | ✓ | ✓ | ✓ |
| C5 | 嵌套滚动（A25） | 在纵向列表 `#nested-list` 中，把横向轮播 `#carousel` 滚动到第 6 张并点击，`#carousel-result` 显示 `Slide 6` | ✓ | ✓ | ✓ |
| C6 | 启动阶段（A26） | 冷启动后不加固定 sleep，直接操作登录页的 `#login-email`（splash 会保持到字体和初始配置加载完成，约 1.5 秒） | ✓ | ✓ | ✓ |
| C7 | 远程图片（A27） | 打开 `#open-image`，断言 `#remote-image` 已加载完成（app 在 `onLoad` 后把 `#image-status` 设为 `Loaded`）；图片由服务端延迟 1.5 秒返回 | ✓ | ✓ | ✓ |
| C8 | 深色模式（A28） | 测试中把系统外观切换为深色，`#theme-indicator` 显示 `dark`；切回浅色后显示 `light` | ✓ | ✓ | ✓ |
| C9 | 横竖屏（A28） | 测试中把设备旋转为横屏，`#orientation-indicator` 显示 `landscape`；转回后显示 `portrait` | ✓ | ✓ | — |
| C10 | 系统语言（A28） | 以日文系统语言启动 app，登录按钮 `#login-submit` 显示 `ログイン`；以中文启动时显示 `登录` | ✓ | ✓ | ✓ |
| C11 | 远程推送（A20） | 用 mock server 的辅助脚本向模拟器发送一条推送（iOS：`xcrun simctl push`；Android：`adb`），点击后 `#notification-target` 显示 `Opened from push` | ✓ | ✓ | — |

C8 和 C10 在 Web 上分别指浏览器的 `prefers-color-scheme` 和浏览器语言。

---

## 4. 界面契约

上文出现的所有 `#xxx` 都是 app 必须提供的 `testID`（Web 上对应 `data-testid`）。M2 实现 app 时，以本文件为准；如需改名，先改本文件。
