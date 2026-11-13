# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: [Semantic Versioning](https://semver.org/lang/ko/)

## [Unreleased]
### Added
- 앱 골격: `:core` 순간 판단 규칙(테스트 7개), `:app` 기어(Pleos SDK)·차속(Android Automotive) 구독, 순간별 화면. 에뮬레이터에서 기어 P/D 반응 확인.
- CI에 안드로이드 빌드·테스트.
- 도구 일체: `.claude/settings.json`(마켓 15, 플러그인 17 켜짐·4 대기), 팀 스킬 9(`.agents/skills`), 에이전트 5(`.claude/agents`), `scripts/find-skill.py`.
- `ai/toolchain.md`: 도구 지도와 관리 규칙. `docs/07-process.md`: 일정·결정·품질 문·위험 관리.
- `ai/`: AI 협업 지도, 에이전트 표, 장치, 지시 기록, 사람이 뒤집은 제안 4건.
- STATS.md와 `scripts/stats.sh`: 숫자마다 다시 세는 명령.
- Mermaid 도식 11장: 주행 상태도, 시스템 맥락도·컨테이너도, 차량 신호 시퀀스, 일정 간트(담당 사람/AI 표기), 사업 타임라인, 이용 여정, AI 협업 지도.
- README 2단 구성: 사람용 위 절반, 심사위원·개발자용 아래 절반. "지금 어디까지" 표.
- THIRD-PARTY-NOTICES.md.
### Changed
- AI 협업 문서를 docs/07에서 루트 `ai/`로 옮김.
- 이동 판단은 차속으로 (11/14 실측: Virtual Console 가속 페달로 재현됨). 11/13의 GPX 판단은 철회.
- 저장소 골격: 입구 문서(README·AGENTS), 규칙 문서(DESIGN·SAFETY·CONTRIBUTING), 설명 문서 docs/01~07, ADR 0001.
