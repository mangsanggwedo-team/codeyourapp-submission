# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 버전: [Semantic Versioning](https://semver.org/lang/ko/)

## [Unreleased]
### Added
- `ai/`: AI 협업 지도, 에이전트 표, 장치, 지시 기록, 사람이 뒤집은 제안 4건.
- STATS.md와 `scripts/stats.sh`: 숫자마다 다시 세는 명령.
- Mermaid 도식 11장: 주행 상태도, 시스템 맥락도·컨테이너도, 차량 신호 시퀀스, 일정 간트(담당 사람/AI 표기), 사업 타임라인, 이용 여정, AI 협업 지도.
- README 2단 구성: 사람용 위 절반, 심사위원·개발자용 아래 절반. "지금 어디까지" 표.
- THIRD-PARTY-NOTICES.md.
### Changed
- AI 협업 문서를 docs/07에서 루트 `ai/`로 옮김.
- 시연의 이동 판단을 차속에서 기어와 GPX 위치 이동으로 (Virtual Console에 차속 조작이 없음).
- 저장소 골격: 입구 문서(README·AGENTS), 규칙 문서(DESIGN·SAFETY·CONTRIBUTING), 설명 문서 docs/01~07, ADR 0001.
