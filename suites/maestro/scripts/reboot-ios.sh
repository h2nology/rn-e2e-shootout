#!/bin/sh
# 重启 iOS 模拟器并等待开机完成（METHODOLOGY 6.4）
U=${IOS_UDID:-$(xcrun simctl list devices booted | grep -m1 -o '[0-9A-F-]\{36\}')}
xcrun simctl shutdown "$U"
xcrun simctl boot "$U"
xcrun simctl bootstatus "$U" >/dev/null
echo "$U"
