#!/usr/bin/env bash
# Pleos 에뮬레이터 Virtual Console 조작. 사용: bash scripts/vc.sh park|stop|drive|brake|shot <이름>|state
# 먼저: 에뮬레이터 실행, 브라우저로 http://127.0.0.1:8088/ 한 번 열기(쓰기 503이면 bridge 준비 전).
set -eu
export ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"
ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
"$ADB" forward tcp:8088 tcp:8088 >/dev/null
put(){ code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "http://127.0.0.1:8088$1"); [ "$code" = 200 ] || { echo "실패 $code $1" >&2; exit 1; }; }
case "${1:-}" in
  park)  put "/vehicle/controls?accelerator=0&brake=100"; put "/vehicle/gear?gear=Park" ;;
  stop)  put "/vehicle/gear?gear=Drive"; put "/vehicle/controls?accelerator=0&brake=100" ;;
  drive) put "/vehicle/gear?gear=Drive"; put "/vehicle/controls?accelerator=${2:-40}&brake=0" ;;
  brake) put "/vehicle/controls?accelerator=0&brake=${2:-100}" ;;
  shot)  mkdir -p docs/assets/screens; "$ADB" exec-out screencap -p > "docs/assets/screens/${2:?이름}.png"; echo "docs/assets/screens/$2.png" ;;
  state) curl -s http://127.0.0.1:8088/vehicle/state | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['gear']['actual']['value'], d['controls']['speed_kph'],'km/h')" ;;
  app)   "$ADB" shell am start -f 0x10008000 -n com.mangsang.app/.MainActivity >/dev/null; "$ADB" shell pm grant com.mangsang.app android.car.permission.CAR_SPEED 2>/dev/null || true ;;
  *) echo "park | stop | drive [가속%] | brake [%] | shot <이름> | state | app"; exit 2 ;;
esac
