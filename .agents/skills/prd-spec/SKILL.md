---
name: prd-spec
description: 정한 아이디어를 Pleos 차량 앱의 만들 수 있는 범위로 바꾼다. 기능마다 문제 추적, 주행/정차 맥락, 쓰는 Pleos SDK, 수용 기준, 시연 단계, 안전 통제를 붙인 기능 명세. 기획서(접수 양식)와 앱 개발이 같은 내용을 보게 할 때. 트리거: "PRD", "기능 명세", "MVP 범위", "기능 정리", "spec".
---

# prd-spec: 기능 명세

CPS가 없으면 `cps-framing` 먼저.

## 먼저 읽기
CPS 문서, `docs/product/user-journey.md`, `docs/architecture/app-structure.md`, `60_submission/proposal/2026-11-12_접수양식_초안.md`, `docs/judging/심사기준.md`

## 순서
1. 기능마다 어느 문제(CPS)와 어느 사용자(운전자/동승자)에 닿는지 적는다.
2. MVP(2차 PT 에뮬레이터 시연분)와 향후 계획을 나눈다. 미공개 SDK가 필요한 기능은 향후 계획으로.
3. 기능마다 입력 신호(SDK·API 이름), 화면 반응, 주행/정차 동작 차이, 오류 상태를 쓴다.
4. 기능마다 확인 가능한 수용 기준과 시연 단계(Virtual Console 값 변화 → 앱 반응)를 붙인다.
5. 주행 중 쓰이면 `risk-compliance` 통제를 연결한다.
6. 범위가 바뀌면 `CHANGELOG.md`와 ADR(`adr-new`)에 남긴다.

## 추적 표
| 기능 | 문제 추적 | 사용자 | 주행/정차 | Pleos SDK | MVP? | 수용 기준 | 시연 단계 | 안전 통제 | 심사 항목 |
|---|---|---|---|---|---|---|---|---|---|

## 통과 기준
- 문제 추적 없는 기능 없음
- SDK가 부가 기능이 아니라 핵심 기능 흐름(신호, 판단, 출력) 안에 있음 (기술 활용성)
- 모바일로도 되는 기능이면 차량에서만의 이유를 한 줄 (차량특화성)
- "똑똑하게 추천" 같은 말 대신 판단 규칙이 보임

출처: River-181/harness-engineering-skills (MIT) `skills/prd-spec/SKILL.md`, 2026-11-14 이식·수정
