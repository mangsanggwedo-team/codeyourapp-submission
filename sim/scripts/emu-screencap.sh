#!/usr/bin/env bash
# Pleos 에뮬레이터 화면을 1초마다 public/emu.png 로 저장한다 → 무대의 "에뮬레이터 화면" 칸이 갱신된다.
# 사용: scripts/emu-screencap.sh [기기 serial, 기본 emulator-5554]   (멈추려면 Ctrl+C)
set -uo pipefail
SERIAL="${1:-emulator-5554}"
OUT="$(dirname "$0")/../public/emu.png"
while true; do
  adb -s "$SERIAL" exec-out screencap -p > "$OUT.tmp" 2>/dev/null && [ -s "$OUT.tmp" ] && mv "$OUT.tmp" "$OUT"
  sleep 1
done
