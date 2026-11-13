# ROADMAP

공모전 일정이 첫 마일스톤이고, 그 뒤는 Pleos App Market 출시와 지속이다. 사업 근거: [06 사업](docs/06-business.md).

## 일정
막대 이름 뒤 괄호는 담당: 사람 / AI. AI가 맡은 막대도 결정과 검수는 사람이 한다([ai/](ai/README.md)).
```mermaid
gantt
    title Code your App 2026
    dateFormat YYYY-MM-DD
    axisFormat %m/%d
    section 대회 (공식)
    접수                         :done, 2026-10-21, 2026-11-15
    1차 제출 마감                 :milestone, crit, 2026-11-15, 0d
    1차 결과                      :milestone, 2026-11-23, 0d
    2차 PT · 동작 앱 시연          :crit, 2026-12-03, 2d
    최종 발표                     :milestone, 2026-12-18, 0d
    section 문제와 기획
    리서치 (사람 김주용 / AI 조사·검증)     :done, 2026-11-08, 2026-11-13
    아이디어 결정 회의 (사람 전원)           :milestone, 2026-11-14, 0d
    기획서 (사람 전원 / AI 초안·모의 심사)    :active, 2026-11-14, 2d
    section 개발
    앱 골격 · 차량 신호 연동 (사람 / AI 코드) :2026-11-16, 7d
    핵심 순간 구현 · 테스트 (사람 / AI 코드)  :2026-11-23, 8d
    section 증명
    시연 영상 · 캡처 (사람 / AI 편집)        :2026-11-28, 4d
    PT 자료 (사람 전원 / AI 초안)            :2026-11-30, 3d
```
<sub>출처: [공모전 공식 사이트](https://appdevchallenge.auto-hmg.io/) · 갱신: 2026-11-13 · 개발 이후 막대는 계획</sub>

| 날짜 | 공식 일정 | 상태 |
|---|---|---|
| 2026-12-19 ~ 2027-01 | 전시 준비 | 종료일 미확인 |
| 2027-02 | 그룹 행사 전시, 최종 순위 시상 | 날짜 미확인 |

## 공모전 이후
| 단계 | 무엇 | 조건 |
|---|---|---|
| 출시 | Pleos App Market 등록 | 최종 선정 시 |
| 지속 | (아이디어 확정 후) | [06 사업](docs/06-business.md) |

## 하지 않기로 한 것
범위 밖으로 뺀 기능과 이유는 결정 기록에: [docs/adr/](docs/adr/)
