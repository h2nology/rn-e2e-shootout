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
