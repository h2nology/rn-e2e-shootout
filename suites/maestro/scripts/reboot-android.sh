#!/bin/sh
# 重启 Android 模拟器并等待开机完成（METHODOLOGY 6.4：每次套件运行前重启模拟器）
# 最多等 BOOT_TIMEOUT 秒（默认 300）；设备不在线（模拟器进程退出等）时报错退出，不无限等待（Quiesco 0.13.0 运行中曾停在 wait-for-device 约 3 小时）
S=${ANDROID_SERIAL:-emulator-5554}
T=${BOOT_TIMEOUT:-300}
if ! adb -s "$S" get-state >/dev/null 2>&1; then
  echo "reboot-android: device $S is not online (is the emulator running?)" >&2
  exit 1
fi
adb -s "$S" reboot
end=$(( $(date +%s) + T ))
until [ "$(adb -s "$S" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do
  if [ "$(date +%s)" -ge "$end" ]; then
    echo "reboot-android: $S did not finish booting within ${T}s" >&2
    exit 1
  fi
  sleep 2
done
sleep 5
