---
name: publish-submission
description: 팀 원본 저장소의 공개할 것(에이전트 명부·정의·메모리, 스킬, AI 조직 그림)을 공개 제출 저장소로 한 방향 출판하고, 공개 금지 내용이 없는지 점검한다. 명부·스킬·그림을 바꾼 뒤, 제출 저장소에 푸시하기 전, 다른 AI나 팀원이 개발을 이어받을 때 쓴다. 트리거: "출판", "제출 저장소에 반영", "publish", "두 저장소 맞추기".
---

# publish-submission: 두 저장소를 어긋나지 않게

두 저장소는 역할이 다르다 (ADR 0006).
- **노하우 저장소 (비공개, 팀 원본)**: 조사, 결정, 회의, 프롬프트 원문, AI 운영체계, 작업판, 명부, 스킬.
- **제출 저장소 (공개, 심사용)**: 앱 코드(`app/`, `core/`)와 심사위원용 문서(README, `docs/`, DESIGN, SAFETY, ROADMAP)는 **여기가 원본**. 나머지 공개분은 노하우에서 출판한다.

파일 하나에 원본은 한 곳. 출판 목록은 `60_submission/publish-manifest.tsv` 하나뿐이다.

## 순서
1. 두 저장소 모두 `git pull`.
2. 노하우에서 원본을 고친다 (명부면 `.agents/registry.tsv` → `python3 scripts/gen_agents.py`, 그림이면 `python3 scripts/gen_ai_viz.py`).
3. `python3 scripts/publish.py` 로 미리 보기 → `python3 scripts/publish.py --apply`.
   - 복사, `.published.json`에 해시 기록, 제출 저장소 `scripts/check_published.py` 공개 점검까지 한 번에.
4. 제출 저장소에서 `git diff` 확인 → 커밋 (`Prompt-Ref: P##`는 노하우 프롬프트 로그 번호 그대로) → 푸시 → CI 초록 확인.
5. 노하우 쪽도 같은 P##로 커밋.

## 지킬 것
- 제출 저장소의 출판 파일(`.published.json` 목록)을 거기서 직접 고치지 않는다. CI가 해시가 다르면 실패시킨다.
- 앱 코드와 심사위원용 문서를 노하우에 복사본으로 두지 않는다 (노하우 `40_app/README.md`는 링크만).
- 공개 금지: 양식 원본 · 동의서 · 서명 · 연락처 · 비밀키 · 로컬 절대경로(`/Users/…`) · 개인 이메일. 출판 목록에 넣기 전에 원본에서 지운다.
- 새 공개 항목은 manifest에 한 줄 + 이유를 적고, 사람(김주용)이 확인한다.
- 푸시·공개 전환은 사람이 정한다. AI는 출판과 점검, 커밋 초안까지.

## 막히면
- "출판 파일을 여기서 고침": 제출 저장소 쪽 변경을 노하우 원본으로 옮기고 다시 `--apply`.
- "로컬 절대경로": 원본 문서의 경로를 저장소 상대경로나 GitHub URL로 바꾼다.
