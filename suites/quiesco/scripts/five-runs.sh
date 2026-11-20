#!/bin/sh
# 正式版连续 N 轮（METHODOLOGY 3 完成标准）。每轮前重启模拟器（METHODOLOGY 6.4）。
#   PLATFORM=ios|android RUNS=5 scripts/five-runs.sh
cd "$(dirname "$0")/.."
# METHODOLOGY 6.4：运行期间防止宿主机睡眠（本脚本退出时 caffeinate 随之结束）
caffeinate -dimsu -w $$ &
PLATFORM=${PLATFORM:-ios}
RUNS=${RUNS:-5}
mkdir -p logs
for i in $(seq "$RUNS"); do
  if [ "$PLATFORM" = ios ]; then ../maestro/scripts/reboot-ios.sh >/dev/null; else ../maestro/scripts/reboot-android.sh; fi
  t0=$(date +%s)
  VARIANT=final npx quiesco test --platform "$PLATFORM" > "logs/$PLATFORM-final-run$i.log" 2>&1
  t1=$(date +%s)
  echo "run $i: $(grep -E '^ +Tests ' "logs/$PLATFORM-final-run$i.log" | tail -1 | sed 's/^ *//') wall=$((t1 - t0))s"
  grep -E '^ +× ' "logs/$PLATFORM-final-run$i.log" || true
done
