# AI 사용 요약 (2026-11)
> 확인 날짜: 2026-11-15. 팀 비공개 저장소의 지시 원문 기록(2026-11-08 ~ 11-15)을 요약했다. 원문에는 실명과 연락처가 있어 공개하지 않는다.

## 규모
- 기록된 지시는 약 170건이다. 대부분 PM이 Claude Code에 보낸 것이고, 일부는 Gemini 심층 리서치와 이미지 생성 도구에 보냈다.
- 지시마다 번호(P001 형식)를 붙이고, 커밋 메시지 끝에 `Prompt-Ref`로 그 번호를 남겨 어떤 지시로 어떤 변경이 생겼는지 되짚을 수 있게 했다.

## AI가 한 일
- 공모 요강, Pleos SDK 문서, 설명회 자료 정리와 질문 목록 작성
- 통계 원문 대조: 숫자마다 1차 원문을 다시 열어 통과, 수정 필요, 사용 금지로 판정 ([stats](stats/README.md))
- 하네스 문서 초안(사업 모델, CPS, 원칙, 정의, 도메인, PRD, 구조, 기능 명세, 흐름, 평가 계획)
- Kotlin 코어(마침 모델, 순간 판단)와 단위 테스트, 에뮬레이터 탐침 앱, 웹 시뮬레이션
- 설계 그림 렌더링, 기획서 그림, 소개 페이지

## 사람이 한 일
- 방향과 범위 결정, 관문 통과 여부 판단 ([관문 1](../harness/GATE1_검토요청.md), [관문 2](../harness/GATE2_검토요청.md))
- AI 제안 뒤집기: 예를 들어 마치기 버튼을 없애고 마침을 짐작하게 한 결정, 등받이를 곧추세우지 않고 조금만 기울이는 결정, 원문에서 확인되지 않은 통계를 빼는 결정
- 최종 문구와 디자인 확정

## 지키는 규칙
- 원문에서 확인한 숫자만 쓴다. 2차 보도에만 있는 숫자는 쓰지 않는다.
- 공개 저장소에는 실명, 연락처, 서명, 개인정보 원본을 올리지 않는다(`scripts/check_published.py`로 매 커밋 점검).

## 에이전트
역할별 에이전트 정의와 각자의 작업 기억이다.

| 에이전트 | 맡은 일 | 정의 | 기억 |
|---|---|---|---|
| conductor | 지휘자. 지시를 쪼개 맡기고 결과를 검증 | [정의](../../.claude/agents/conductor.md) |  |
| contest-ops | 공모전 운영, 일정과 제출 점검 | [정의](../../.claude/agents/contest-ops.md) | [기억](../../.claude/agent-memory/contest-ops/MEMORY.md) |
| creative-director | 아트 디렉션, 표현 사이의 일관성 | [정의](../../.claude/agents/creative-director.md) | [기억](../../.claude/agent-memory/creative-director/MEMORY.md) |
| design-reviewer | 화면과 그림을 차량 UX 원칙으로 검토 | [정의](../../.claude/agents/design-reviewer.md) | [기억](../../.claude/agent-memory/design-reviewer/MEMORY.md) |
| developer | 앱, 코어, 시뮬레이션 개발 | [정의](../../.claude/agents/developer.md) | [기억](../../.claude/agent-memory/developer/MEMORY.md) |
| fact-verifier | 주장을 원문과 대조해 판정 | [정의](../../.claude/agents/fact-verifier.md) | [기억](../../.claude/agent-memory/fact-verifier/MEMORY.md) |
| judge | 심사위원 셋을 시뮬레이션해 채점 | [정의](../../.claude/agents/judge.md) | [기억](../../.claude/agent-memory/judge/MEMORY.md) |
| proposal-writer | 기획서와 README 문장 | [정의](../../.claude/agents/proposal-writer.md) | [기억](../../.claude/agent-memory/proposal-writer/MEMORY.md) |
| researcher | 사실과 출처 수집 | [정의](../../.claude/agents/researcher.md) | [기억](../../.claude/agent-memory/researcher/MEMORY.md) |

더 자세한 협업 방식: [ai/](../../ai/README.md)
