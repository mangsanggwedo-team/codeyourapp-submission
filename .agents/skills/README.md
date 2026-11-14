# 스킬

이 앱을 만들 때 쓴 팀 스킬. 열린 표준 SKILL.md 형식이라 Claude Code와 Codex가 함께 읽는다(`.claude/skills`는 이 폴더를 가리킨다). 전체 도구 그림: [ai/toolchain.md](../../ai/toolchain.md).

| 스킬 | 언제 |
|---|---|
| [pleos-app-scaffold](pleos-app-scaffold/SKILL.md) | 앱 골격, 에뮬레이터 Virtual Console 자동 시나리오·캡처, 릴리스 |
| [web-sim](web-sim/SKILL.md) | 한 파일 웹 차량 화면 시뮬 (기획서 이미지·시연 백업) |
| [key-visual](key-visual/SKILL.md) | 키 비주얼·배너·포스터 |
| [motion-graphic](motion-graphic/SKILL.md) | 모션·시연 영상·숏폼 |
| [web-demo-video](web-demo-video/SKILL.md) | Playwright 녹화 → 자막 mp4 |
| [diagram-render](diagram-render/SKILL.md) | 도식 PNG (기획서용) |
| [skill-scout](skill-scout/SKILL.md) | 필요한 스킬·플러그인 찾기와 점검 (`scripts/find-skill.py`) |
| [judge-sim](judge-sim/SKILL.md) | 심사 기준으로 모의 채점 |
| [submission-check](submission-check/SKILL.md) | 제출 직전 점검 |
| [risk-compliance](risk-compliance/SKILL.md) | 운전자 주의분산 · 외부 STT 금지 · 공개 SDK 규칙 점검 |
| [prd-spec](prd-spec/SKILL.md) | 기능 명세와 Pleos SDK · 주행 상태 · 심사 항목 추적 표 |
| [eval-design](eval-design/SKILL.md) | Virtual Console 입력 → 기대 반응 골든 케이스 |
| [publish-submission](publish-submission/SKILL.md) | 팀 원본 저장소 → 이 저장소 한 방향 출판과 공개 점검 |

스킬 파일은 팀 원본 저장소에서 출판된다(`.published.json`). 일부 스킬은 팀 노하우 저장소(비공개, 리서치·회의 기록)의 경로를 가리킨다. 그 경로는 이 저장소에 없다.
