#!/bin/sh
# C11：向 iOS 模拟器发送一条模拟的远程推送。
# 用法：sh scripts/push-ios.sh [device]   （device 默认为 booted）
set -eu
DEVICE="${1:-booted}"
BUNDLE_ID="${BUNDLE_ID:-com.rnshootout.app}"
PAYLOAD="$(mktemp -t rnshootout-push).apns"
cat > "$PAYLOAD" <<JSON
{
  "Simulator Target Bundle": "$BUNDLE_ID",
  "aps": { "alert": { "title": "Push from rnshootout", "body": "Tap to open" } },
  "target": "push"
}
JSON
xcrun simctl push "$DEVICE" "$BUNDLE_ID" "$PAYLOAD"
rm -f "$PAYLOAD"
