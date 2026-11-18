#!/bin/sh
# Maestro 用的 Release 构建（METHODOLOGY 2.2）。app 不需要任何改动（E2E_TOOL=none，不加插件）。
# 产物复制到 suites/maestro/build/，避免被其他工具的 prebuild --clean 清掉。
# 用法：./build.sh ios | android
set -e
cd "$(dirname "$0")"
OUT="$PWD/build"
APP="$PWD/../../app"
mkdir -p "$OUT"
cd "$APP"
E2E_TOOL=none CI=1 npx expo prebuild --clean --no-install --platform "$1"
case "$1" in
  ios)
    cd ios && pod install
    xcodebuild -workspace rnshootout.xcworkspace -scheme rnshootout -configuration Release \
      -sdk iphonesimulator -derivedDataPath build-maestro
    rm -rf "$OUT/rnshootout.app"
    cp -R build-maestro/Build/Products/Release-iphonesimulator/rnshootout.app "$OUT/"
    ;;
  android)
    # -Xmx4g：Expo 生成的 gradle.properties 默认 2 GB，R8 有 OOM 风险（Detox 接入时实测）
    cd android && ./gradlew assembleRelease -Dorg.gradle.jvmargs=-Xmx4g
    cp app/build/outputs/apk/release/app-release.apk "$OUT/"
    ;;
  *) echo "usage: $0 ios|android" >&2; exit 1 ;;
esac
