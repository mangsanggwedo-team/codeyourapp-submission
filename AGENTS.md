# AGENTS.md

AI 코딩 도구가 이 저장소에서 먼저 읽는 파일. 사람용 입구는 [README.md](README.md).

## 이 저장소
2026 현대자동차그룹 Pleos 'Code your App' 공모전 출품작 **(앱 이름)**의 소스·실행물·설명 문서.
Pleos Connect(현대차그룹 차량 OS) 위에서 도는 Android(Kotlin) 앱이다.

## 지도: 한 질문에 한 파일
```
README.md          무엇이고 어떻게 실행하나        (사람 심사위원의 입구)
AGENTS.md          AI의 입구, 이 파일
DESIGN.md          화면·음성 경험의 규칙
SAFETY.md          운전자 안전·차량 데이터·개인정보 원칙
ROADMAP.md         공모전 이후, 사업의 지속
CONTRIBUTING.md    우리가 일하는 법 (커밋·리뷰·AI 사용)
CHANGELOG.md       버전별 변화
THIRD-PARTY-NOTICES.md  상표·SDK·캡처의 출처와 조건
STATS.md           다시 셀 수 있는 숫자 (scripts/stats.sh가 생성)
app/               Android 소스            apk/   심사용 APK
docs/01→07         WHY → WHAT → HOW → PROOF → NEXT (심사 4항목에 대응)
docs/adr/          결정 기록, 왜 이렇게 했나
ai/                AI 협업의 증거: 에이전트 · 장치 · 지시 기록 · 사람이 뒤집은 제안 · 도구(toolchain)
.agents/skills/    팀 스킬 9 (.claude/skills가 가리킴) · .claude/ 플러그인 선언·에이전트 5
```
주장을 검증하려면: README "심사 기준 대응표" → 해당 docs → docs 안의 코드 링크 → [추적표](docs/05-demo.md#추적표).

## 명령
- 빌드: `./gradlew :app:assembleDebug` · 릴리스: `./gradlew :app:assembleRelease`
- 테스트: `./gradlew :core:test`
- 문서 링크 검사: `python3 scripts/check_links.py`
- 에뮬레이터 장면: `bash scripts/vc.sh park|stop|drive|brake|shot|state|app`
- 숫자 갱신: `bash scripts/stats.sh` (README의 숫자는 STATS.md에서만)
(골격 있음: `:core` 판단 규칙 + `:app`. 순간별 경험은 아이디어 확정 후.)

## 정본 순서
주장이 서로 다르면: 코드·테스트 > docs > README. README는 요약만 하고 숫자는 STATS.md에서만 가져온다.
README에 넣지 않는 것: 심사위원에게 읽는 법을 지시하는 문장, 같은 내용 반복, 실측 없는 차트.

## 규칙
- 주행 중 상호작용은 [SAFETY.md](SAFETY.md)의 한도를 넘지 않는다. 넘는 기능은 만들지 않는다.
- 결정은 사람이 한다 → `docs/adr/`. AI는 선택지와 근거를 낸다.
- 커밋: Conventional Commits + `Prompt-Ref: P##`(AI가 만든 커밋) 또는 `Human-Only: true`. → [CONTRIBUTING.md](CONTRIBUTING.md)
- 비밀값·연락처·공모전 양식 원본은 커밋하지 않는다(`.githooks/pre-commit`이 막는다).
- 문서 링크는 상대경로 md 링크.
- 문체: 줄표 문자를 쓰지 않는다. 쉼표·콜론·괄호로. 자리 표시는 "(작성 예정: …)" 또는 "미정".
