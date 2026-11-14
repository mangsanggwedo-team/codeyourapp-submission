---
name: web-sim
description: 차량 화면과 차량 상태 조작판을 한 파일 HTML로 만든 웹 시뮬레이터. 앱이 완성되기 전에도 아이디어를 "실제 차 화면처럼" 보여 주고, 기획서 이미지·시연 영상·PT 라이브 데모에 쓴다. 트리거: "시뮬레이션 화면", "웹 시뮬", "차 화면 목업", "인터랙티브 데모", "sim".
---

# web-sim: 한 파일 차량 화면 시뮬레이터

본보기: `~/Projects/teum-pleos/sim/index.html` (28KB, 외부 의존 없음, 시연 영상 촬영에 사용). 결과 예: `teum-pleos/docs/sim/*.png`.

## 왜
- 1차(기획서)엔 앱이 없다. 시뮬 캡처가 "작동하는 경험"을 보여 주는 가장 빠른 길.
- 2차 PT에서 에뮬레이터가 말썽이면 대체 시연.
- 심사위원이 링크 하나로 열어 볼 수 있다(GitHub Pages는 공개 저장소일 때만, 비공개면 HTML 파일 첨부/영상).

## 만드는 법
1. 화면 크기: Pleos Connect 2560x1440 (AVD 기준). 차량 화면 영역 + 오른쪽에 차량 상태 조작판(기어 P/R/N/D, 이동, 착좌, 도어, 배터리 등 아이디어가 쓰는 신호만).
2. 상태는 하나의 JS 객체 → `render(state)` 한 함수. 앱의 core 판단 로직과 같은 규칙(같은 임계값)을 쓴다. 규칙이 갈리면 시뮬이 거짓말이 된다.
3. 주행 상태면 화면을 한 줄 + 큰 글자로 줄인다(DESIGN 상태도). 시뮬에서도 안전 규칙을 지켜 보인다.
4. 시각: `DESIGN.md` 토큰, Pretendard. `frontend-design`·`ui-ux-pro-max`·`taste-skill` 플러그인으로 미감 점검, `creative-director` 에이전트 검토.
5. 장면 버튼(① 출발 ② 주행 ③ 정차 ④ 도착)으로 한 번에 상태를 바꾸는 시나리오 모드를 둔다 → 촬영이 재현 가능해진다.

## 뽑아내기
- 캡처: Python Playwright로 장면마다 `page.screenshot` (2560x1440, device_scale_factor 1) → `docs/assets/screens/sim_*.png`. 캡션에 "웹 시뮬레이터 화면(실제 앱 아님)" 명시.
- 영상: `web-demo-video` 스킬(Playwright 녹화 → ffmpeg mp4).
- 둘 다 끝나면 `design-reviewer`·`creative-director` 검토.
