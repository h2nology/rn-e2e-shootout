#!/bin/sh
# C10 Android：切换模拟器的系统语言后各跑一个 flow，最后恢复 en-US。
# Maestro 只能用 `maestro start-device --device-locale` 新建设备时设置语言（官方文档），`maestro test` 不能改；
# 这里用外部命令（root + persist.sys.locale + 重启 zygote）改现有模拟器的系统语言。
cd "$(dirname "$0")/.."
S=${ANDROID_SERIAL:-emulator-5554}
set_locale() {
  adb -s "$S" root >/dev/null; sleep 2
  adb -s "$S" shell setprop persist.sys.locale "$1"
  adb -s "$S" shell setprop ctl.restart zygote
  sleep 5; adb -s "$S" wait-for-device
  until [ "$(adb -s "$S" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 2; done
  sleep 5
}
set_locale ja-JP; SKIP_INSTALL=1 PLATFORM=android ./run.sh flows/capability/c10-language-android-ja.yaml
set_locale zh-CN; SKIP_INSTALL=1 PLATFORM=android ./run.sh flows/capability/c10-language-android-zh.yaml
set_locale en-US
adb -s "$S" unroot >/dev/null
