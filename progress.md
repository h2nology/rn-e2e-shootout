# Progress Log

## Session: 2026-11-17

### Phase 0: 计划书定稿

- **Status:** complete
- Actions taken:
  - 审阅并两轮修订 `e2e-comparison-plan.md`（公平性、统计方法、A12–A28、S12–S23、C1–C11）
  - 确定 Quiesco 0.5.0 + Vitest、scheme `rnshootout`
- Files created/modified:
  - `e2e-comparison-plan.md`

### Phase 1: M1 仓库骨架与预注册文档

- **Status:** complete
- **Started:** 2026-11-17
- Actions taken:
  - 初始化规划文件（task_plan.md / findings.md / progress.md）
  - 盘点宿主机环境与 npm 最新版本（见 findings.md）
  - `git init -b main`，按计划书第 1 节建目录骨架（各目录放 `.gitkeep`），加 `.gitignore`
  - 起草 `scenarios.md`（S1–S23、C1–C11、测试数据、界面契约、平台适用性）
  - 起草 `METHODOLOGY.md`（v1 草案：版本、诊断版/正式版、W1–W3/X、重置、重试、N、交错、时间定义、Wilson、施压、易用性、矩阵、报告规则）
  - 起草 `README.md`（含立场披露）
  - 用户确认：中文文档、MIT、规划文件入 Git
  - 加 `LICENSE`；文档状态改为 v1 预注册；首次 commit 并打 tag `methodology-v1`

### Phase 2: M2 被测 app + mock server

- **Status:** in_progress
- **Started:** 2026-11-17
- Actions taken:
  - `create-expo-app --template default@sdk-58` 生成 `app/`（未安装依赖；删除模板自带 LICENSE）
  - 实现 mock-server（Node 24 原生 TS + `ws`）：reset / config（施压）/ 测试注入 / 业务接口 / WebView 与 OAuth 页面 / 延迟图片 / WebSocket / iOS 推送脚本
  - curl 冒烟测试通过（见 Test Results）
  - app：配置 app.json（name/scheme `rnshootout`、bundle id / package `com.rnshootout.app`、ATS / cleartext、各权限插件、orientation default、web.output single）
  - app：安装依赖；删除模板示例代码；实现 lib（api / anim(jitter) / store / i18n）、组件（ui / toast / confirm-modal / date-field(.web) / web-frame(.web)）
  - app：实现全部路由（login、tabs：home / explore(嵌套 stack) / settings、item/[id]、add、controls、permission、webview、busy、reanimated、live、reorder、long-form、notification-target、biometric、system、dup、nested、image、auth）
  - `npx tsc --noEmit` 通过
  - mock-server 常驻 :4000、Metro 常驻 :8081
  - iOS：`expo run:ios` 因 usbmuxd 失败 → `pod install` + `xcodebuild`（135 s）成功；安装到 iPhone 17 / iOS 27
  - iOS 模拟器设置：语言 en / en_US，关闭 Reduce Motion，浅色外观（原为日文 + Reduce Motion 开启）
  - iOS：登录页内容被原生标题栏遮挡，三次修复均无效（见 task_plan.md Errors），已上报用户
  - Android：prebuild + `gradlew assembleDebug`（347 s）成功；安装后首次启动出现“附近设备”权限弹窗，walkthrough 未开始
  - 用户决定：只测 SDK 58（Detox 官方只支持到 RN 0.84，已记录）
  - 用户同意打 Release 构建：iOS Release 下标题栏正常 → 撤回第 2、3 次修复；嵌套 Pressable 改为并列结构；返回按钮只显示箭头
  - iOS Release 走查（临时 Maestro flow，scratchpad，不入库）：登录、删除 Modal、新增、busy、Reanimated、live、WebView、long-form、dup / a11y、远程图片、深链接全部通过；controls / reorder / system 截图正常
  - 发现：iOS 外部打开深链接有系统确认框（S21 相关）；遗留的系统弹窗不会因 app 重启而消失（harness 需每次重启模拟器）
  - Android Release（`assembleRelease`）走查：full-walk 全部通过；无“附近设备”弹窗
  - Web（`expo export -p web` + `serve -s`）：Maestro Web 点击无法把焦点移到密码框、不支持 `pressKey: Tab`（记为 M3 参考）；改用 scratchpad 内 Playwright 1.65.1（locale en-US）走查，19 项全部通过
  - 手势 / 权限 flow（iOS + Android）：S12 左滑删除、S13 下拉刷新、S14 长按菜单、S10 定位权限全部通过
  - 未走查（留到 M3 首次实现时验证）：S14 拖拽、S7 IME、S8 滑块 / 原生日期选择、S22 通知、S23 前后台、C1 生物识别、C2 OAuth、C3 分享、C8 深色、C9 横屏、C11 推送
- Files created/modified:
  - `app/**`、`mock-server/**`
- Files created/modified:
  - `task_plan.md`、`findings.md`、`progress.md`
  - `.gitignore`、`README.md`、`scenarios.md`、`METHODOLOGY.md`、各目录 `.gitkeep`

### Phase 3: M3 四套测试实现

- **Status:** in_progress
- **Started:** 2026-11-17
- Actions taken:
  - 补验 M2 遗留交互（iOS / Android Release，临时 Maestro flow + simctl / adb 命令）：S23、S19、S14 拖拽、S8 滑块 / 日期、C2 OAuth、C3 分享、C8 深色、C9 横竖屏、S22 本地通知、C11 iOS 推送、C1 iOS Face ID 全部走通
  - 修复 app：通知发送前申请权限；splash 期间挂载导航器；`/auth` 原生端立即返回
  - 回归：iOS full-walk / gestures 全部通过；system 中通知需点 Allow（已知，见 findings）
- Files created/modified:
  - `app/src/app/(tabs)/settings.tsx`、`app/src/app/_layout.tsx`、`app/src/app/(tabs)/_layout.tsx`、`app/src/lib/store.ts`、`app/src/app/auth.tsx`、`findings.md`

- Detox 接入（iOS）：首个测试通过（约 6 分钟，含缓存，仅供参考）；诊断版 / 正式版全套 iOS 已跑；S11 同步绕过方式修正；S21 iOS ✗（RN 0.88 下 Detox URL API 不生效）
- Detox Android：API 37 上无法运行（InputManager.getInstance 被移除）→ 用户选方案 B → 新建 API 36 AOSP / google_apis AVD 实测 → METHODOLOGY v3（tag methodology-v3）
- app 在 API 36 AOSP 上重新走查：full-walk / gestures 全部通过
- iOS S10b（Detox system API 点击权限弹窗）通过
- Files created/modified: `suites/detox/**`、`app/app.config.ts`、`app/package.json`、`METHODOLOGY.md`、`scenarios.md`

## Session: 2026-11-18

- Appium 接入开始：`E2E_TOOL=none` prebuild（app 零改动）；iOS / Android Release 构建（后台）
- `suites/appium` 本地安装 appium 4.0.0 + xcuitest 13.1.1 + uiautomator2 9.2.1（官方文档只写全局安装，为固定版本改为项目本地，官方 managing-exts 指南支持该方式）；两个驱动 doctor 无必需修复
- WebdriverIO 10.2.0 测试运行器（mocha、appium-service、junit / spec reporter）；npm 11 拦截的 edgedriver / geckodriver / esbuild install script 移动端不需要，已拒绝
- 写 `wdio.conf.js`、`test/support.js`、S1 诊断版
- Android Release 构建 309 s；S1 诊断版首次失败（列表不出现：app 经 localhost:4000 访问 mock server，Appium 不做 adb reverse）→ `onPrepare` 中执行 `adb reverse` 后通过（约 09:14）。Appium 4.0.0 + WDIO 10.2.0 可配合（WDIO 文档写 Appium 3，peer 为 `>=3`）

## Test Results

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| mock-server 冒烟 | `GET /items?q=Item 04` | 10 条（Item 040–049） | 10 条 | pass |
| mock-server 冒烟 | `POST /login` 正确 / 错误 | 200 / 401 | 200 / 401 | pass |
| mock-server 冒烟 | `POST /items` | id 501 | id 501 | pass |
| mock-server 冒烟 | `/test/fail` count=1 后两次 `GET /items` | 500 → 200 | 500 → 200 | pass |
| mock-server 冒烟 | `WS /ws` | 每 500 ms 一条 | 收到 tick 1、2 | pass |
| mock-server 冒烟 | `GET /image.png` | ≈1.5 s + 网络延迟 | 2.02 s，64×64 PNG | pass |
| iOS Release 走查 | full-walk.yaml（iPhone 17 / iOS 27） | 全部步骤通过 | 全部通过（S6 长滚动因 Maestro 速度跳过，app 滚动正常） | pass |
| Android Release 走查 | full-walk.yaml（Medium Phone API 37） | 全部步骤通过 | 全部通过 | pass |
| Web 走查 | Playwright walk.mjs（Chromium，en-US） | 19 项通过 | 19 项通过 | pass |
| 手势 / 权限 | gestures.yaml（iOS + Android） | S12 / S13 / S14 长按 / S10 通过 | 全部通过 | pass |
| M3 补验（iOS） | extra / system / notif / push / bio flow | 系统级交互可走通 | 全部走通（通知需点 Allow；Face ID 失败路径需点取消） | pass |
| M3 补验（Android） | android-extra / android-extra2 | 系统级交互可走通 | 全部走通（需关闭 Chrome 首次启动向导） | pass |
| 回归（iOS，修复后） | full-walk / gestures / notif | 全部通过 | 全部通过 | pass |
| Detox iOS 诊断版 | S1–S23 | 观察 | 修正写法后：S11 超时、S17 失败、S21 失败，其余通过 | info |
| Detox iOS 正式版 | S1–S23 | 除 ✗ 外全绿 | 21 通过（S11 修正后）/ S21 ✗ / S10b、S22 跳过 | pass（S21 ✗） |
| Detox 正式版 5 轮（卸载重装式重置） | iOS / Android 各 5 轮 | 除 ✗ 外全绿 | iOS 5 轮均 22 通过 / S21 冷启动失败（同一行）/ S22 跳过；Android 5 轮均 22 通过 / S10b、S22 跳过 | pass（作废：重置方式不符合 METHODOLOGY 5，重跑） |
| Detox C1–C11（iOS） | 能力检查 | 记录 ✓ / ✗ | C1 需外部 notifyutil；C2 ✗；C7 需 waitFor；C10 写法修正（toHaveLabel）后 ✓；C11 ✗ | info |
| Detox C1–C11（Android） | 能力检查 | 记录 ✓ / ✗ | C2（GAPIS）✗；C3 需关闭同步；C10 写法修正后 ✓；C11 ✗；C9 待实测 | info |
| 重置方式改正冒烟 | S1 / S10 / S23 两平台 | 通过 | 全部通过 | pass |
| Detox 正式版 5 轮（只清数据重置） | iOS / Android 各 5 轮 | 除 ✗ 外全绿 | iOS 5 轮均 22 通过 / S21 ✗（同一行）/ S22 跳过；Android 5 轮均 22 通过 / S10b、S22 跳过 | pass |
| Detox C1–C11（重跑） | 两平台 | 记录 | 与初步结果一致；C9 Android `setOrientation` 可用，加 waitFor 后连续 3 次通过 | info |

## Error Log

| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
|           |       | 1       |            |

- mock server 修复：请求途中客户端断开导致进程崩溃（`aborted` 未捕获）→ handler 包 catch
- 诊断版（S1–S23）两平台已跑：Android 17/24（真实失败 S6 超时、S11 / S16 UiAutomator2 等待空闲卡死、S23 保存请求被 terminateApp 切断）；iOS 2/24（默认输入速度下登录丢字符，依赖登录的场景全部失败）。补充观察（只把输入节奏调到 20）：iOS 7/24，S10b 弹窗残留导致后续连带失败
- 正式版（`test/final`）进行中。已确定的处理：
  - iOS 文本输入：`typeText` 先输入第一个字符并 W3 等值反映，再输入其余（冷启动 24/24）；`maxTypingFrequency` 20 不可靠（4/8），已撤回
  - S3 Android 改为 W3C 按键逐字输入 + `hideKeyboard`（UiAutomator2 看不到被键盘挡住的行）
  - S6 W3 等列表 + 超时 300 s + `percent 0.8 / duration 1000`（iOS 约 179 s）
  - S9 iOS：WebView 内按钮用 `tap()`（`click` 无效）+ W3 `waitForDisplayed`（单独跑约 2/16 偶发失败，原因未定）
  - S10b iOS：W2 点击后弹窗仍在则重点（模拟器重启后第一次点击常被忽略；重启后 4/4）
  - S11 / S16 Android：X `waitForIdleTimeout: 0`；S12 / S13 / S18 W3 等首次加载；S23 W3 等 `item-row-501`
  - S22 iOS：通知权限用 `reloadSession` + `appium:permissions`（会话中途 `setPermission` 会断开 WDA）；通知中心的同 app 通知折叠为组（label 含 Grouped）→ 先展开
- iOS 正式版全套最近一轮（final-3）：20/24（S12、S13、S18 已修改未重跑；S22 未解决）
- **暂停点（用户要求暂停）**：S22 iOS 展开分组后点击通知不打开 app。截图显示点击被识别为横向滑动（卡片右滑露出 “Open” 后弹回）；`click` / `tap()` / 停 1.5 s 后点 / 点卡片按钮均无效。下一步：试点 “Open” 按钮、在通知中心先清空本 app 通知、或改为单条通知时再点；之后跑 Android 正式版全套、两平台各 5 轮、C1–C11、WAITS.md、RESULTS.md
- **恢复（2026-11-18）**：
  - S22 iOS 解决：右滑通知卡片露出 “Open” 再点（操作方式变通，不属于等待），连续 3 次通过；诊断版同步改
  - iOS 正式版全套 final-4：20/23 spec（S9 偶发、S13 写法错误——等待前取了列表元素、S18 iOS 同一文字有两个嵌套 StaticText 触发严格模式）
  - S13 调整顺序；S18 两版都改为取 `$$(...)[0]`；S9 加 W2（点完结果仍为 Waiting 则重点；单独 16 次未复现，失败截图页面正常、坐标不变，原因未查明）
  - C1–C11 脚本 `suites/appium/test/capability/c-all.js` 已写，未执行
  - Android 正式版全套首次 23/23；S9（W2）、S13、S18 修正后 iOS 也通过
  - **5 轮**：iOS 5 × 23/23（530–542 s）、Android 5 × 23/23（368–519 s），无偶发失败
  - C1–C11：iOS 全 ✓（C1、C3 需 W2）；Android C1 需额外配置（登记指纹，测完已清除 PIN）、C2 GAPIS ✓、C11 ✗，其余 ✓；S7b iOS 需额外配置（simctl 登记键盘，3/3）、Android ✗
  - WAITS.md（iOS W2×2 / W3×10；Android W3×2 / X×2）、RESULTS.md、METHODOLOGY 5 Appium 行已写
  - 环境恢复：iOS 键盘 AppleKeyboards = en_US；AOSP PIN / 指纹已清除；GAPIS 模拟器已关闭
- **Appium 接入完成**。下一步 Maestro
- **Maestro 接入开始（2026-11-18 16:25）**
  - Maestro CLI 2.11.0（已安装）；构建复用 Appium 的 `E2E_TOOL=none` 产物（app 零改动），`suites/maestro/build.sh` 同 Appium
  - iOS `clearState` 会重装 app（官方文档）→ `scripts/device-helper.mjs`（本地 HTTP，代执行 simctl）+ `flows/common/reset.yaml`（onFlowStart）；Android 用官方 `launchApp clearState`；`launchApp` 默认授予全部权限 → `permissions: { all: unset }`
  - 首个测试通过：iOS 16:31、Android 16:39
  - 诊断版：iOS 19/24（S6 默认超时、S9 WebView 点击过早、S10a / S21 / S22 写法问题已修正后通过）；Android 22/24（S6；S5 为下述模拟器问题）
  - Android “触摸全部丢失”（起初误判为 launcher 问题）：根因是 Maestro 在 app 窗口尚不能接收输入时点击，注入的 DOWN 被丢弃但仍记为按下，之后所有注入点击被拒绝（logcat `pointers already down for device -1`；注入 UP 可解除）。正式版在 Android 重置后加 `waitForAnimationToEnd`（W3），重启后 S1 连续 20 次 0 发生（未加时约 1/6）。详见 findings.md
  - 等待脚本踩坑：`pgrep -f "maestro.*test"` 会匹配等待脚本自己的命令行，导致永远等不到 → 改为检查输出文件
  - 正式版：S6 W3（timeout 300 s；speed 100 会惯性越过第 400 行）；S9 W3 `retryTapIfNoChange`（iOS 5/5）
  - 5 轮尝试记录（全部保留，供 RESULTS 引用）：
    - Android 第 1 次（加 WAITS #1 之前）：第 1 轮 6/24（重启后第一个场景就发生触摸失效）→ 中止，查明根因
    - Android 第 2 次（加 #1 后）：5 × 24/24（797–915 s，含重启）。当时 S9 为 `retryTapIfNoChange` 版
    - iOS 第 1 次：第 1 轮 23/24（S9：`retryTapIfNoChange` 判为“界面已变化”不重试）；第 2 轮 1/24（S3 中 Maestro iOS 驱动截图超时 `Timed out while requesting screenshot`，约 6.5 分钟后 XCTest runner 重启，Maestro 未恢复，其余 23 个 flow 1 秒内全部失败）→ 中止
    - S9 改为 W2（`repeat while notVisible`），iOS 单独 6/6、Android 1/1；iOS 5 轮重新开始，之后 Android 用最终代码再跑 5 轮
  - **最终 5 轮**：iOS 5 × 24/24（9 分 46 秒–9 分 51 秒）；Android（最终代码）5 × 24/24（13 分 11 秒–14 分 29 秒）
  - C1–C11：iOS C1 需额外配置（notifyutil；Cancel 需按 id）、C11 需额外配置（push-ios.sh 经 helper），其余 ✓；Android C1 需额外配置（PIN + 指纹登记，测完已清除 PIN）、C2 GAPIS ✓、C6 ✓（依赖 WAITS #1）、C10 需额外配置（flow 外 setprop + 重启 zygote）、C11 ✗，其余 ✓；S7b iOS 需额外配置（3/3）、Android ✗
  - WAITS.md（iOS W2×1 / W3×1；Android W3×2）、RESULTS.md、SETUP-LOG.md、METHODOLOGY 5 Maestro 行已写
  - 环境恢复：iOS 键盘 en_US；Android AOSP 模拟器、en-US、无 PIN；GAPIS 模拟器已关闭
- **Maestro 接入完成**。下一步 Quiesco

## Session: 2026-11-19

- **Quiesco 接入（0.7.0，用户决定由 0.5.0 升级；使用 quiesco@h2nology 插件）** → METHODOLOGY v4（版本变更 + 插件披露），README / 计划书版本号同步
  - `quiesco init`（13 s）→ 测试侧移到 `suites/quiesco`；app 侧保留 agent / native / expo-plugin、metro、index.ts，根布局包 `<QuiescoRoot>`。expo-plugin 必须一直在 app.json（非 e2e 构建由它排除 native 模块）
  - Release 构建约 7 min；首个测试通过 iOS 09:24、Android 09:25（从 09:15 起）
  - 诊断版：iOS 20/24（S6 超时；S8 / S21 / S22 写法问题已修正）、Android 21/24（S6 工具缺陷、S22 openNotification 只找 5 s、S8 写法问题）
  - 用插件 debug 技能 + failure-investigator agent 定位：Android scrollTo 在 RefreshControl 列表上失效；scrollTo 露细边即停 + tap 瞄准整行中心（点到标题栏）；openNotification Android 写死 5 s（均为 Quiesco 缺陷，见 findings.md）
  - 环境修正：iOS 模拟器 AppleLocale `US` → `en_US`（METHODOLOGY 6.4）
  - C10 iOS 需 CFBundleLocalizations → 用户决定只加在 Quiesco 构建（app.config.ts quiesco 叠加），重建 iOS
  - **最终 5 轮**：iOS 5 × 24/24（385–392 s）、Android（最终代码）5 × 24/24（258–445 s）。中止 / 作废的尝试见 RESULTS.md
  - C1–C11：iOS C2 ✗、C3 ✗（其他进程 UI 不可见）、C5 需额外说明、C10 需额外配置，其余 ✓；Android C2 需额外配置（adb input text）、C5 需额外说明、C10 ✓（per-app language）、C11 ✗，其余 ✓；S7b 两平台 ✗
  - WAITS：iOS W2×1 / W3×1；Android W2×2 / W3×1；X 0（S11 / S15 / S16 不需要同步绕过）
  - 环境恢复：iOS 键盘 en_US、AppleLocale en_US；Android AOSP、en-US、无 PIN；GAPIS 已关闭
- **Quiesco 接入完成**。M3 四套全部完成，下一步 M4 harness
- **Quiesco 0.8.0 重跑**（用户要求：0.8.0 发布，#44–#55 已关闭；插件由用户更新到 0.8.0）
  - `appDir` + `init --upgrade`（包固定 0.8.0，删除 `e2e:*` 脚本）；`doctor` 在 `suites/quiesco` 中全部通过；重置 hook 改为 `setupFiles`；去掉 C10 的 `CFBundleLocalizations`（不再需要）
  - 测试代码改用 0.8.0 API：S3 perCharacter、S6 / C5 直接 scrollTo、S8 system.tap、S21 后台 openUrl、S22 去重试、C2 system.type、C3 iOS system.expectVisible + tapAt；support.ts 中外部命令全部删除
  - 诊断版：iOS 22/24、Android 23/24（S6 两平台 #63；S22 iOS #65）
  - 能力检查：iOS C1–C11 全部 ✓、S7b iOS ✓；Android C11 ✗，其余 ✓（C2 GAPIS ✓）
  - 正式版：第 1 次 iOS 4/5（S22 #64 → W3）、Android 3/5（S10b #66 → X；S18 #67 → W3）；最终代码 iOS 3/5（S22 #65、#68）、Android 3/5（S6 卡住超过 300 s，原因未定）
  - 新 issue：h2nology/quiesco#63–#68（用户要求提交）
  - **用户决定：按现状记录，等 Quiesco 修复后重跑**。RESULTS.md 标为“未达到 M3 完成标准”
- METHODOLOGY v4（Quiesco 0.8.0 + 插件披露）用户确认，打 tag `methodology-v4`

## Session: 2026-11-20

- **Quiesco 0.9.0 重跑**（用户要求：0.9.0 发布，#63–#68 已关闭；插件由用户更新到 0.9.0）
  - `init --upgrade`（8.5 s；改回精确版本 0.9.0、删除 `e2e:*` 脚本）；`doctor` 通过
  - 构建改为 `quiesco build ios|android --clean`（用户指出），删除 `build.sh`；iOS `binaryPath` 改为 xcodebuild 产物路径；Gradle 4 GB 经 `GRADLE_OPTS`；iOS 217 s、Android 210 s
  - 正式版去掉 0.8.0 的 S6 300 s `timeoutMs`、S22 30 s、S18 `expectVisible`、S10b `sync: false`
  - 诊断版：iOS 23/24、Android 22/24。**S12 两平台 app 崩溃**（`native-module` 包装在 tracker 关闭时也安装 → Gesture Handler worklet 调用 JS 包装函数）→ 用户要求提交 h2nology/quiesco#74。S6 Android 一步之后空闲 > 10 s（单独 6/6 通过）→ 每步 30 s（W3）
  - 正式版 5 轮：iOS 5 × 23/24（396–415 s）、Android 5 × 23/24（286–289 s），失败只有 S12；S22 iOS、S10b / S18 Android 无等待 5/5
  - 能力检查：iOS 全部 ✓（C1 / C3 整套中偶发失败，单独通过）；Android C11 ✗，其余 ✓（C2 GAPIS ✓）
  - WAITS：iOS W3×1、Android W3×2、X 0
  - 其他：`@quiesco/core` 0.9.0 残留 `DBG` 调试输出
  - METHODOLOGY v5（Quiesco 0.9.0）用户确认，打 tag `methodology-v5`
  - 环境恢复：Android 切回 AOSP（GAPIS 已关闭）

- **Quiesco 0.10.0 重跑**（用户要求：0.10.0 发布，#74–#78 已关闭；插件由用户更新）
  - `init --upgrade`（改回精确版本 0.10.0、删除 `e2e:*` 脚本）；`doctor` 1 项误报（scripts 检查把 `E2E_TOOL=quiesco quiesco build` 读成 `quiesco quiesco`）
  - 构建：iOS 224 s、Android 267 s
  - 诊断版：iOS 23/24（S22：模拟器通知权限丢失 → 环境恢复后重跑 24/24）、Android 23/24（S6 超过 120 s 单测超时）。S12 两平台通过（#74 修复）、`DBG` 消失（#75）
  - 环境：iOS 模拟器的通知设置 13:46 左右被重建（用户的操作）；用一次性测试恢复通知授权
  - 正式版 5 轮：Android 5 × 24/24（228–268 s）✓；iOS 23、24、24、24、24（341–366 s），第 1 轮 S22：runner 冷启动 11.8 s 错过横幅 → 通知中心路径，iOS 27 上点击只露出 “Open”、Quiesco 3 s 后才点（findings 0.10.0 N3）
  - 能力检查：Android 同 0.9.0（C11 ✗；C2 GAPIS ✓，已切回 AOSP）。iOS：C1 整套中失败、单独 2/2 ✓；**S7b 失败 4 次**（`AppleKeyboards` 写入后键盘进程不认，重启也一样；0.9.0 时同一方法可用，推测与 13:46 的模拟器设置重建有关，未查明）；其余 ✓
  - **用户决定**：13:46 的重建是用户的操作；S22 iOS 按现状记录、等修复（不在测试侧绕过）；提交 issue → h2nology/quiesco#82–#87
  - RESULTS / WAITS / SETUP-LOG 更新；METHODOLOGY v6（Quiesco 0.10.0）用户确认，打 tag `methodology-v6`
  - S6 Android 的慢（用户询问）：录屏（144 s）与诊断版前未重启模拟器（执行者疏漏）所致；重启后诊断版 24/24（S6 36.8 s），单独约 36 s（平均每步 582 ms）。其他工具 Detox 约 120 s、Maestro 约 190 s
  - S7b iOS 补测：用户在“设置”中手动添加键盘后 2/2 ✓；用户的键盘设置已写回

- **Quiesco 0.11.0 重跑**（用户要求：0.11.0 发布，#82–#87 已关闭；插件由用户更新；2026-11-20 – 21）
  - `init --upgrade`（改回精确版本、删除 `e2e:*` 脚本）；`doctor` 通过（#83 修复，新增 app IDs warning）；构建 iOS 196 s、Android 211 s
  - 诊断版两平台 24/24。S6 iOS 68 s / Android 110 s：不是回归（Vitest 排序使 S6 承担重启后冷启动 + 宿主机负载；源码只多了每步一条 `step` 通知）
  - 正式版 5 轮：iOS 5 × 24/24（#82 修复）；Android 第 1 轮 S18 失败（#67：登录后 `AsyncStorage.setItem` 期间 tap 提前返回）
  - **用户决定**：开启 `native-module` tracker（`metro.config.js` 的 `nativeModules: true` + config `sync.trackers`），重建后全部重跑
  - tracker 开启：诊断版两平台 24/24（S12 不崩溃）；Android 5 × 24/24；iOS 第一次 5 轮因 macOS 睡眠（`pmset` 逐秒对应，Dark Wake Thermal Emergency）作废 → `caffeinate -dimsu` 下重跑 5 × 24/24。METHODOLOGY 6.4 本已要求防睡眠，执行者疏漏；`five-runs.sh` 加入 `caffeinate`
  - S6 Android tracker 开 / 关对照：无差别，耗时由宿主机负载决定（35–165 s）
  - 能力检查：同 0.10.0（iOS C1 整套中失败、单独第 2 次通过；Android C11 ✗）；用户的键盘设置已写回
  - RESULTS / WAITS / SETUP-LOG / findings 更新；METHODOLOGY v7（Quiesco 0.11.0）用户确认，打 tag `methodology-v7`
  - C1 iOS 调查（用户要求，2026-11-21）：重启后第一次 Face ID 对话框只在 `com.apple.LocalAuthenticationUIService` 的树中、不在 SpringBoard 的树中，Quiesco 不读该 app（重启后 3 / 3 失败、不重启 2 / 2 通过；`OTHER_APPS` 本地补丁 2 / 2 通过，已还原）→ 提交 h2nology/quiesco#92
  - 速度对比（用户询问）：0.9.0 / 0.10.0 / 0.11.0 各场景中位数基本相同，整轮差别来自 S6（冷启动顺序、负载）、S22 iOS（#82）；tracker 开启后 Android S8 / S10b 各 +2 s → timeline 确认为对话框的原生调用（`RNCDatePicker.open`、`ExpoLocation.requestForegroundPermissionsAsync`）
  - 提交 issue（用户要求）：h2nology/quiesco#93（对话框 +2 s）、#94（tracker 默认关闭时竞争无提示）、#95（`init --upgrade`）、#96（`doctor` 与 `app.config.ts`）

- **Quiesco 0.12.0 重跑**（用户要求：0.12.0 发布，#92–#96 已关闭；插件由用户更新；2026-11-21）
  - `init --upgrade`：精确版本、不加脚本（#95 ✓）；`doctor` 无 warning（#96 ✓）；config 删除 `sync.trackers`（#94 默认开启）；构建 iOS 192 s、Android 212 s
  - `scripts/full-check.sh`（新增）：诊断版 iOS 23/24（S22：runner 冷启动 12.3 s + 通知中心中前一天的通知堆叠 → 10 s 超时；重跑 24/24）、Android 24/24
  - 正式版 5 轮：iOS 5 × 24/24（336–344 s）、Android 5 × 24/24（224–226 s）；Android S8 / S10b 回到 tracker 关闭水平（#93 ✓）
  - 能力检查：iOS 12/12（C1 整套中通过，#92 ✓）；Android C11 ✗；键盘设置已写回；无睡眠事件
  - RESULTS / WAITS / SETUP-LOG / findings 更新；METHODOLOGY v8（Quiesco 0.12.0）用户确认，打 tag `methodology-v8`
  - 提交 issue（用户要求）：h2nology/quiesco#100（S22 iOS 诊断版：通知中心中的堆叠 + 横幅等待 5 s → 10 s 超时）

- **Quiesco 0.12.1 重跑**（用户要求：0.12.1 发布，#100 已关闭；插件由用户更新；2026-11-21）
  - 只改 `@quiesco/core` `ios.ts`（`openNotification`）；`init --upgrade` 干净、`doctor` 无 warning；重建 iOS 193 s、Android 202 s
  - `full-check.sh`：诊断版两平台 24/24；正式版 iOS 5 × 24/24（第 2、3 轮 S22 走通知中心路径并通过，#100 ✓）；Android 24、24、24、24、23（第 5 轮 S6 SYNC_TIMEOUT）；能力检查同 0.12.0；无睡眠事件
  - S6 Android 交给 `failure-investigator`：FlatList 窗口边缘一行反复增删（推断，行高 51/52 交替、无 `getItemLayout`），非负载、非 Quiesco
  - RESULTS / WAITS / SETUP-LOG / findings 更新；METHODOLOGY v9（Quiesco 0.12.1）用户确认，打 tag `methodology-v9`
  - S6 按现状记录（不改 app）；提交 issue（用户要求）：h2nology/quiesco#102（FlatList 窗口边缘反复增删时的诊断）

- **Quiesco 0.13.0 重跑**（用户要求：0.13.0 发布，#102 已关闭；插件由用户更新；2026-11-22）
  - 只改 `@quiesco/agent` frame-stable 诊断；`init --upgrade` 干净、`doctor` 无 warning；重建 iOS 191 s、Android 174 s
  - `full-check.sh`：诊断版 iOS 24/24、Android 23/24（S6 同位置，新报错 `went back and forth in 20 of the last 20 changes` → #102 推断确认）；iOS 正式版 24、24、24、23、24（第 4 轮 S22：login 中 `keyboard moving`，iOS 读剪贴板 10.27 s 使 `didShow` 迟到）
  - Android 第一次正式版第 2 轮 S7a 中模拟器进程退出（原因不明），脚本停在 `adb wait-for-device` 约 3 小时；冷启动后重跑：Android 5 × 24/24；能力检查同 0.12.0；键盘写回；无睡眠事件
  - 速度与 0.12.1 相同；RESULTS / WAITS / SETUP-LOG / findings 更新；METHODOLOGY v10 待确认
