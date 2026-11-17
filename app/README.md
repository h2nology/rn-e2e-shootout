# app

被测 Expo app（Expo SDK 58、Expo Router、New Architecture）。界面契约（`testID`）以 [`../scenarios.md`](../scenarios.md) 为准。

本 app 不包含任何测试工具的代码。各工具接入时需要对 app 做的改动（例：Quiesco 的 `<QuiescoRoot>`、Detox 的 config plugin）都放在对应的 `suites/<tool>/` 中说明，并计入“对 app 的侵入”和“改动文件数”。

## 运行

先启动 mock server（见 [`../mock-server`](../mock-server)）。

```sh
npm install
npx expo prebuild          # 生成 ios/ 与 android/（不入库）
npx expo start --dev-client
```

### iOS 模拟器

```sh
cd ios && pod install
xcodebuild -workspace rnshootout.xcworkspace -scheme rnshootout -configuration Debug \
  -destination 'id=<模拟器 UDID>' -derivedDataPath build
xcrun simctl install <UDID> build/Build/Products/Debug-iphonesimulator/rnshootout.app
xcrun simctl launch <UDID> com.rnshootout.app
```

### Android 模拟器

```sh
adb reverse tcp:4000 tcp:4000   # mock server
adb reverse tcp:8081 tcp:8081   # Metro
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Web

```sh
npx expo start --web
```

## 配置

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000` | mock server 地址 |

施压条件（动画时长 jitter 等）由 mock server 的 `/config` 下发，app 启动时读取。

## 页面一览

| 路由 | 功能 | 对应 |
|---|---|---|
| `/login` | 登录 | A1 |
| `/`（Home Tab） | 列表、搜索、新增入口、删除、左滑删除、下拉刷新、长按菜单、错误重试 | A2–A6、A12、A16 |
| `/explore`（Explore Tab，内嵌 Stack） | 计数器、二级页面、各演示页入口 | A17 |
| `/settings`（Settings Tab） | Toast、本地通知、各演示页入口 | A15、A20 |
| `/item/[id]` | 详情（深链接 `rnshootout://item/<id>`） | A19 |
| `/add` | 新增条目 | A6、A7、A23 |
| `/controls` | 开关、滑块、日期选择器 | A8 |
| `/permission` | 定位权限弹窗 | A10 |
| `/webview` | WebView | A9 |
| `/busy` | 永不静止的动画 | A11 |
| `/reanimated` | Reanimated 弹簧动画 | A13 |
| `/live` | 轮询 + WebSocket | A14 |
| `/reorder` | 拖拽排序 | A12 |
| `/long-form` | 键盘遮挡 | A18 |
| `/biometric` | 生物识别 | A21 |
| `/system` | OAuth、分享面板、深色模式、横竖屏 | A22、A28 |
| `/dup` | 选择器 | A24 |
| `/nested` | 嵌套滚动 | A25 |
| `/image` | 远程图片 | A27 |
| `/notification-target` | 通知 / 推送落地页 | A20 |
