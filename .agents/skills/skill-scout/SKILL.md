---
name: skill-scout
description: 어떤 스킬·플러그인이 필요한지 모를 때, 가진 것부터 3천여 개 디렉터리까지 찾아서 점검하고 골라 설치한다. 트리거: "이거 하는 스킬 있나", "스킬 찾아", "플러그인 찾아", "find skill", "더 좋은 도구 없나".
---

# skill-scout: 필요한 능력을 찾아 붙이기

## 1. 찾기 (가까운 곳부터)
```bash
python3 -I scripts/find-skill.py 모션 motion video     # 한국어+영어 단어를 같이
```
| 순서 | 어디 | 규모 (2026-11-13) |
|---|---|---|
| 1 | 우리 스킬 `.agents/skills/` | 19개 |
| 2 | 이 맥에 받아 둔 마켓플레이스 16곳의 SKILL.md (설치 안 된 것 포함) | 1,300여 개. ECC 하나에 314개 |
| 3 | Anthropic Directory (`~/.claude/plugins/plugin-directory-cache-v2.json`) | 3,691개, 검토 상태 표시 |
| 4 | 없으면: 웹 검색, `last30days` 플러그인으로 최근 평판 | |

마켓플레이스 목록이 낡았으면 `claude plugin marketplace update`.

## 2. 점검 (설치 전, 표로 남긴다)
| 점검 | 기준 |
|---|---|
| 출처 | Anthropic 공식·Directory 검토 완료 > 유명 저장소(별·최근 커밋) > 개인. 모르는 출처의 스크립트는 읽어 본다 |
| 하는 일 | SKILL.md를 열어 실제 절차 확인. 설명만 화려한지 |
| 위험 | 네트워크 전송, 비밀값 요구, 광범위 권한, 자동 실행 훅 |
| 무게 | 에이전트·스킬 수십 개짜리 묶음(ECC 314, omc)은 컨텍스트를 먹는다. 필요한 스킬 하나만 본떠 우리 스킬로 |
| 라이선스 | 상업·공모전 사용 가능? (예: Remotion은 회사 규모별 조건) |
| 겹침 | 이미 가진 것과 같은 일인가 |

## 3. 붙이기
- 팀 전체: `claude plugin install <이름>@<마켓> --scope project` → `.claude/settings.json`에 선언이 남는다 → 커밋.
- 일부만 필요: 해당 SKILL.md를 읽고 우리 말로 다시 써서 `.agents/skills/<이름>/` (출처 링크 남김, 복사하지 않음).
- 잠깐만: 세션 안에서만 쓰고 기록 안 함.
- 썼으면 `docs/tools/registry.md`에 한 줄(실사용 날짜·결과물). 제출 저장소 `ai/toolchain.md`에도.

## 우리가 들고 있는 것 (요약)
켜 둔 플러그인 17 · 필요할 때 켜는 것 4(harness-engineering, harness, oh-my-claudecode, ECC) · 마켓 15+Directory. 전체: registry.md (팀 노하우 저장소 `docs/tools/registry.md`)
