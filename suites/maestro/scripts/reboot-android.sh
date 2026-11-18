#!/bin/sh
# 重启 Android 模拟器并等待开机完成（METHODOLOGY 6.4：每次套件运行前重启模拟器）
S=${ANDROID_SERIAL:-emulator-5554}
adb -s "$S" reboot
adb -s "$S" wait-for-device
until [ "$(adb -s "$S" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 2; done
sleep 5
