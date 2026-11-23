#!/bin/sh
# Detox 用的 Release 构建（METHODOLOGY 2.2）。以 E2E_TOOL=detox 重新 prebuild，使 expo-detox-config-plugin 生效。
# 产物复制到 suites/detox/build/，避免被其他工具的 prebuild --clean 清掉（与 Appium / Maestro 相同）。
# 用法：./build.sh ios | android
set -e
cd "$(dirname "$0")"
OUT="$PWD/build"
APP="$PWD/../../app"
mkdir -p "$OUT"
cd "$APP"
E2E_TOOL=detox CI=1 npx expo prebuild --clean --no-install --platform "$1"
case "$1" in
  ios)
    cd ios && pod install
    xcodebuild -workspace rnshootout.xcworkspace -scheme rnshootout -configuration Release \
      -sdk iphonesimulator -derivedDataPath build-detox
    rm -rf "$OUT/rnshootout.app"
    cp -R build-detox/Build/Products/Release-iphonesimulator/rnshootout.app "$OUT/"
    ;;
  android)
    # -Xmx4g：Expo 生成的 gradle.properties 默认 2 GB，R8 压缩测试 APK 时 OOM（实测）
    cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -Dorg.gradle.jvmargs=-Xmx4g
    cp app/build/outputs/apk/release/app-release.apk "$OUT/"
    cp app/build/outputs/apk/androidTest/release/app-release-androidTest.apk "$OUT/"
    ;;
  *) echo "usage: $0 ios|android" >&2; exit 1 ;;
esac
