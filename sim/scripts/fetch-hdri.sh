#!/usr/bin/env bash
# Poly Haven HDRI 1k (CC0, 표기 불필요) 3장을 public/hdri/ 에 받는다. 저장소에는 넣지 않는다(.gitignore).
# 조명(환경광)으로만 쓰고 배경으로는 보이지 않는다 (아트 디렉션 7절).
set -euo pipefail
cd "$(dirname "$0")/../public" && mkdir -p hdri && cd hdri
for id in kloppenheim_06_puresky qwantani_dusk_2_puresky moonless_golf; do
  [ -s "${id}_1k.hdr" ] || curl -fsSL -o "${id}_1k.hdr" "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/${id}_1k.hdr"
  echo "${id}_1k.hdr $(shasum -a 256 "${id}_1k.hdr" | cut -c1-16)"
done
