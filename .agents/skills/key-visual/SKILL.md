---
name: key-visual
description: 망상궤도의 키 비주얼, README 배너(다크/라이트), 기획서 표지, 홍보 포스터, SNS 이미지를 같은 시각 언어로 만든다. HTML 렌더가 기본, 필요하면 Blender 정지 렌더나 생성형 이미지(표기 필수). 트리거: "키 비주얼", "홍보 이미지", "배너", "포스터", "표지", "썸네일".
---

# key-visual: 한 장의 인상

## 먼저 정할 것 (creative-director 에이전트와)
- 한 문장 컨셉(아이디어의 순간) · 주인공 장면 하나 · 강조색 1개(`DESIGN.md` 토큰) · 금지 3개(뻔한 차 사진, 대시보드 클리셰, 아이콘 나열 등).
- 참고: `10_research/domain/2026-11_situation-survey/01_현대UX브리프.md`(심사 스튜디오의 결) · `04_감성레퍼런스.md` · `10_research/references/2026-11-08_poster-refs/`.

## 규격
| 산출물 | 크기 | 위치 |
|---|---|---|
| README 배너 | 1440x480, 다크·라이트 두 장 | 제출 저장소 `docs/assets/banner-{dark,light}.png` |
| 기획서 표지·키 비주얼 | 1920x1080 | `30_design/renders/` |
| 포스터 | A3 비율 2480x3508 | `30_design/renders/` |
| SNS·숏폼 썸네일 | 1080x1350, 1080x1920 | `60_submission/video/` |

## 방법 (위에서부터)
1. **HTML → PNG** (`diagram-render` 스킬과 같은 헤드리스 Chrome): 글자·레이아웃이 정확하고 고치기 쉽다. 원본 HTML은 `30_design/source-assets/`.
2. **Blender 정지 렌더** (Blender 5.2.2, `blender -b -P scene.py`로 헤드리스, 11/14 확인): 차 실내·오브젝트의 입체감이 필요할 때. 차 모델은 CC0/CC-BY만, 현대 차 형상·로고 금지(사용 조건 미확인).
3. **생성형 이미지** (Higgsfield 등, PM 계정 커넥터): 분위기 컷만. 캡션에 "AI 생성 (도구명)". 사실 장면으로 오해될 컷 금지. 크레딧을 쓰므로 실행 전 PM 승인.
4. 피그마 정리본: `figma` 플러그인으로 같은 컷을 피그마에 올려 디자이너가 다듬는다.

## 점검
같은 선·같은 색·같은 목소리(DESIGN 원칙 4) · 2초 안에 컨셉이 읽히나 · 글자 깨짐(한글 글리프) · AI 생성 표기.
