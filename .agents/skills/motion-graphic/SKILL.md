---
name: motion-graphic
description: 시연 영상의 타이틀·전환·인포그래픽 애니메이션, 숏폼(세로), 아이디어 설명 모션을 코드로 만든다. HTML/CSS 애니메이션을 Playwright로 녹화해 ffmpeg로 합친다. 트리거: "모션 그래픽", "숏폼", "인트로 영상", "애니메이션 설명", "영상 편집".
---

# motion-graphic: 코드로 만드는 움직임

## 언제 무엇을
| 산출물 | 길이 | 방법 |
|---|---|---|
| 시연 영상 (2차 PT 필수 시연의 백업, 가산점) | 1~3분 | 에뮬레이터 화면 녹화(`adb shell screenrecord`) 또는 `web-sim` + `web-demo-video` 스킬, 자막 |
| 타이틀·장 전환·엔딩 | 3~5초씩 | HTML/CSS 애니메이션 → Playwright 녹화 |
| 아이디어 설명 모션 (기획서 링크용) | 30~60초 | 장면별 HTML(상태도·여정이 움직이는 인포그래픽) → 녹화 → 이어 붙이기 |
| 숏폼 (특별상, 가산점 없음) | 15~30초 세로 1080x1920 | 같은 소스를 세로로. 대본은 김주용 로컬 `viral-hooks`·`storytelling` 스킬 |

## 파이프라인
1. 장면 목록(스토리보드 표: 장면 · 초 · 화면 · 자막 · 소리)을 먼저. `creative-director` 검토.
2. 장면마다 HTML 한 장, CSS 애니메이션(키프레임) 또는 Web Animations API. 시간축을 고정(애니메이션 길이 = 장면 길이).
3. Playwright `record_video_dir`로 장면 녹화 → `ffmpeg`로 이어 붙이기·자막(`subtitles=`)·음원(라이선스 기록, `docs/tools/registry.md`).
   `ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -pix_fmt yuv420p -r 30 out.mp4`
4. 원본(HTML·스토리보드)은 `30_design/source-assets/motion/`, 결과 mp4는 Drive(큰 파일), 링크만 저장소에.
5. 대안: Remotion(React로 영상). 회사 규모별 라이선스 확인 전엔 쓰지 않는다. 생성형 영상(Higgsfield)은 B롤만, "AI 생성" 표기, 크레딧은 PM 승인.

## 점검
첫 2초에 무엇인지 보이나 · 자막만으로 이해되나(무음 재생 가정) · 주행 중 장면이 안전 규칙을 어기는 것처럼 보이지 않나.
