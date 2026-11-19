#!/bin/sh
# Quiesco 用的 Release 构建（METHODOLOGY 2.2：JS bundle 内嵌，不连 Metro）。
# 开关是 EXPO_PUBLIC_QUIESCO=1：prebuild 时 @quiesco/expo-plugin 链接 @quiesco/native，打包时 withQuiesco() 放入真正的 agent。
# Quiesco 官方的 `quiesco build` 在 app 目录内读取 quiesco.config 的 binaryPath；本仓库的测试工程在 suites/quiesco，
# 因此与其他工具一样用脚本构建，产物复制到 suites/quiesco/build/。
# 用法：./build.sh ios | android
set -e
cd "$(dirname "$0")"
OUT="$PWD/build"
APP="$PWD/../../app"
mkdir -p "$OUT"
cd "$APP"
export E2E_TOOL=quiesco EXPO_PUBLIC_QUIESCO=1
CI=1 npx expo prebuild --clean --no-install --platform "$1"
case "$1" in
  ios)
    cd ios && pod install
    xcodebuild -workspace rnshootout.xcworkspace -scheme rnshootout -configuration Release \
      -sdk iphonesimulator -derivedDataPath build-quiesco
    rm -rf "$OUT/rnshootout.app"
    cp -R build-quiesco/Build/Products/Release-iphonesimulator/rnshootout.app "$OUT/"
    ;;
  android)
    cd android && ./gradlew assembleRelease -Dorg.gradle.jvmargs=-Xmx4g
    cp app/build/outputs/apk/release/app-release.apk "$OUT/"
    ;;
  *) echo "usage: $0 ios|android" >&2; exit 1 ;;
esac
