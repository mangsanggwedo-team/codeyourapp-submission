# 룸19 통계 사이트

- `index.html`: 파일 하나로 열린다(D3 CDN 필요). 섹션 A~F 요약 그래프 + G 자료실(데이터셋 전부 자동 시각화).
- 데이터: `data_main.json`(요약 그래프용, index.html 안에도 포함), `data_hmc.json`(현대차 재무·판매), `data_social.json`(한국·세계 사회), `verified_new.json`(1차 확인 메모).
- 감사(2026-11-15 오후, 할루시네이션 검증): `audit_hmc.md`, `audit_social.md`. 판정 `audit_verdicts_*.json`은 자료실 배지로 표시되고 "사용 금지"는 화면에서 빠진다. 정정 `audit_*_fixes.json`은 주요 항목 반영 완료.
- 데이터를 고치거나 늘린 뒤: `python3 build.py`
- PT에 숫자를 쓸 때는 `../D12_글로벌타깃/05_PT_인용카드.md`의 원문 확인 항목만.
