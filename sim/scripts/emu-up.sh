#!/usr/bin/env bash
# 한 번에: Pleos 에뮬레이터 켜기(꺼져 있으면) → adb forward 8088 → 화면을 1초마다 public/emu.png 로.
# 사용: npm run emu   (멈추려면 Ctrl+C. 에뮬레이터는 계속 켜 둔다)
set -uo pipefail
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$SDK/platform-tools:$SDK/emulator:$PATH"
AVD="${AVD:-Pleos_Connect}"
SERIAL="${SERIAL:-emulator-5554}"

if ! adb devices | grep -q "^$SERIAL[[:space:]]*device"; then
  echo "에뮬레이터 켜는 중: $AVD"
  nohup emulator -avd "$AVD" -no-snapshot-save >/tmp/pleos-emu.log 2>&1 &
  adb -s "$SERIAL" wait-for-device
  until [ "$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
fi
adb -s "$SERIAL" forward tcp:8088 tcp:8088
echo "연결 준비: http://127.0.0.1:8088 · 화면 복사 시작 (무대에서 '연결')"
exec "$(dirname "$0")/emu-screencap.sh" "$SERIAL"
