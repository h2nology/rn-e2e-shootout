#!/bin/sh
# 版本升级后的整套检查：诊断版 → 正式版连续 N 轮 → 能力检查（每次运行前重启模拟器，METHODOLOGY 6.4）。
#   PREFIX=q0120 scripts/full-check.sh
# 结束后写回模拟器的键盘设置（S7b 会改写 AppleKeyboards），并列出运行期间的睡眠记录（pmset）。
cd "$(dirname "$0")/.."
caffeinate -dimsu -w $$ &
PREFIX=${PREFIX:-run}
IOS_UDID=${IOS_UDID:-booted}
mkdir -p logs
start=$(date '+%Y-%m-%d %H:%M:%S')
kb=$(xcrun simctl spawn "$IOS_UDID" defaults read -g AppleKeyboards 2>/dev/null | sed -n 's/^ *"\(.*\)",\{0,1\}$/\1/p')
reboot() { if [ "$1" = ios ]; then ../maestro/scripts/reboot-ios.sh >/dev/null; else ../maestro/scripts/reboot-android.sh >/dev/null 2>&1; fi; }
summary() { echo "$1: $(grep -E '^ +Tests ' "$2" | tail -1 | sed 's/^ *//')"; grep -E '^ +× ' "$2" || true; }
for p in ios android; do
  reboot $p
  VARIANT=diagnostic npx quiesco test --platform $p > "logs/$PREFIX-$p-diagnostic.log" 2>&1
  summary "$p diagnostic" "logs/$PREFIX-$p-diagnostic.log"
done
for p in ios android; do PLATFORM=$p scripts/five-runs.sh; done
for p in ios android; do
  reboot $p
  VARIANT=capability npx quiesco test --platform $p > "logs/$PREFIX-$p-capability.log" 2>&1
  summary "$p capability" "logs/$PREFIX-$p-capability.log"
done
if [ -n "$kb" ]; then
  # shellcheck disable=SC2086
  IFS='
'; xcrun simctl spawn "$IOS_UDID" defaults write -g AppleKeyboards -array $kb; unset IFS
  echo "keyboards restored: $(xcrun simctl spawn "$IOS_UDID" defaults read -g AppleKeyboards | tr -d '\n ')"
fi
echo "sleep events since $start:"
pmset -g log | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2} ' | awk -v s="$start" '$0 >= s' | grep -E ' (Sleep|DarkWake|Wake) +' | grep -v "Assertions" | tail -20
uptime
