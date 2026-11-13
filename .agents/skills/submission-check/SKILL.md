---
name: submission-check
description: 공모전 제출 직전 게이트. 정보자산·개인정보 노출, 링크 작동, APK 이름, 메일 형식, AI 말투를 점검하고 남은 일 표를 낸다. 발송은 하지 않는다. 트리거: "제출 점검", "마감 전 체크", "보내기 전에".
---

# submission-check — 제출 게이트

| # | 확인 | 방법 |
|---|---|---|
| 1 | 저장소에 양식 원본·동의서·서명·연락처 없음 | `git -c core.quotepath=off ls-files` 에서 form-original·동의서·서명 0건, pre-commit 통과 |
| 2 | 공개 전환 전이면 이력 전체 점검 | `git log --all --name-only` 에 form-original 0건 (있으면 공개 금지, 사람에게 보고) |
| 3 | APK `apk/망상궤도_앱이름_release.apk`, **release 빌드**, 설치·실행 확인 | 에뮬레이터 |
| 4 | 기획서 링크(GitHub·영상·피그마) 전부 열림 | 시크릿 창 |
| 5 | 메일 제목 `[차량용 앱 개발 공모전] 망상궤도_김주용`, 팀원 전원 CC | 초안만 작성 |
| 6 | 글이 사람 말투인가 | `humanize-korean` 플러그인 → 사람이 최종 읽기 |
| 7 | AI 사용 공개, 팀원이 구조·로직을 직접 설명 가능 | README·ai/ 링크, 2차 PT 기술 Q&A 대비 |
| 8 | README 필수 5항목 (앱 이름·한 줄 소개·실행 방법·**에뮬레이터 버전과 화면 규격**·APK 위치) | README 첫 화면 |
| 9 | 메일에 저장소 주소 + **최종 커밋 번호(commit hash)** | `git rev-parse HEAD`, 초안에 기입 |
| 10 | **11/16(월)까지 Public 전환, 11/23까지 유지** (안 하면 개발 산출물 가산점 없음, 공지 7) | 2번 통과 후 **사람이** 전환. Collaborator 초대는 필요 없음 |
| 11 | 쓴 SDK가 공개 문서 범위, 차량 마이크 음성 외부 STT 전송 없음 (공지 8) | docs/04 |

- 기준 문서: 심사 기준 문서(팀 노하우 저장소 docs/judging/심사기준.md)
- 결과표를 `60_submission/submission-log.md`에 추가. **발송·제출·공개 전환은 사람이.**
