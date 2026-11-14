---
name: judge-sim
description: 심사위원 입장에서 기획서·저장소·시연을 공모전 심사 기준으로 채점하고 가장 약한 곳 3개를 낸다. 제출 전·PT 전에. 트리거: "심사위원처럼", "채점해", "약점", "모의 심사".
---

# judge-sim: 모의 심사

1. 기준 읽기: `10_research/domain/2026-11-08_대회의본질.md`, 제출 안내(`60_submission/proposal/2026-11-12_접수양식_초안.md`). 기준을 지어내지 않는다: 문서에 없는 기준은 [추정] 표시.
2. 심사위원 3명을 따로 세운다: 현대 UX 담당 / 플랫폼(Pleos) 개발자 / 사업·서비스 기획. 각자 30초 안에 README·기획서 첫 쪽만 본다고 가정.
3. 항목별 점수(근거 문장 인용) → 합의 점수 → **가장 약한 곳 3개와 각각 고칠 한 가지**.
4. 결과: `70_records/retros/YYYY-MM-DD_모의심사.md`. Claude Code면 서브에이전트 `judge`에 맡긴다.

참고: 원본 jb-finai-adapter의 구조(심사 기준 → 증거 매핑 → 빈틈 → 고칠 것 → 우선순위 표)를 본뜰 수 있다. https://github.com/River-181/harness-engineering-skills (skills/jb-finai-adapter) (River-181/harness-engineering-skills, MIT, 이식 안 함)
