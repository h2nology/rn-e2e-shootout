#!/bin/sh
# Maestro 套件的运行入口。
#   PLATFORM=ios|android  VARIANT=diagnostic|final  ./run.sh [flow 文件或目录 ...]
# 不给 flow 时运行 flows/$VARIANT 下的全部场景。JUnit 输出到 reports/$PLATFORM-$VARIANT/。
# 前提：mock server 已在 localhost:4000 运行；模拟器已启动（iOS：iPhone 17 / iOS 27.0；Android：emulator-5554）。
set -e
cd "$(dirname "$0")"
PLATFORM=${PLATFORM:-ios}
VARIANT=${VARIANT:-final}
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="reports/$PLATFORM-$VARIANT"
mkdir -p "$OUT" logs

case "$PLATFORM" in
  ios)
    DEVICE=${IOS_UDID:-$(xcrun simctl list devices booted | grep -m1 -o '[0-9A-F-]\{36\}')}
    [ -n "$SKIP_INSTALL" ] || xcrun simctl install "$DEVICE" build/rnshootout.app
    ;;
  android)
    DEVICE=${ANDROID_SERIAL:-emulator-5554}
    [ -n "$SKIP_INSTALL" ] || adb -s "$DEVICE" install -r build/app-release.apk >/dev/null
    # app 通过 localhost:4000 访问 mock server；Maestro 不做 adb reverse，用外部命令补齐
    adb -s "$DEVICE" reverse tcp:4000 tcp:4000 >/dev/null
    ;;
  *) echo "PLATFORM must be ios|android" >&2; exit 1 ;;
esac

# device-helper（iOS 数据清除、固定停留、能力检查用的外部命令）
IOS_UDID=$DEVICE ANDROID_SERIAL=$DEVICE node scripts/device-helper.mjs > "logs/helper-$STAMP.log" 2>&1 &
HELPER=$!
trap 'kill $HELPER 2>/dev/null' EXIT INT TERM
sleep 0.5

[ $# -gt 0 ] || set -- "flows/$VARIANT"
# 自动重试：本地 maestro test 没有自动重试（只有 Maestro Cloud 有），flow 中也不使用 retry 命令（METHODOLOGY 6.1）
maestro --device "$DEVICE" test -e MAESTRO_VARIANT="$VARIANT" \
  --format junit --output "$OUT/report-$STAMP.xml" \
  --test-output-dir "logs/$PLATFORM-$VARIANT-$STAMP" \
  "$@"
