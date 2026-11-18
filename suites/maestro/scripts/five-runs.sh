#!/bin/sh
# 正式版连续 N 轮（METHODOLOGY 3 完成标准）。每轮前重启模拟器（METHODOLOGY 6.4）。
#   PLATFORM=ios|android RUNS=5 scripts/five-runs.sh
cd "$(dirname "$0")/.."
PLATFORM=${PLATFORM:-ios}
RUNS=${RUNS:-5}
UDID=$(xcrun simctl list devices booted | grep -m1 -o '[0-9A-F-]\{36\}')
for i in $(seq "$RUNS"); do
  if [ "$PLATFORM" = ios ]; then scripts/reboot-ios.sh >/dev/null; else scripts/reboot-android.sh; fi
  t0=$(date +%s)
  out=$(IOS_UDID=$UDID SKIP_INSTALL=1 PLATFORM=$PLATFORM VARIANT=final ./run.sh 2>&1)
  t1=$(date +%s)
  echo "run $i: $(echo "$out" | grep -E 'Flows? (Passed|Failed)' | tail -1) wall=$((t1 - t0))s"
  echo "$out" | grep -E '^\[Failed\]' || true
done
