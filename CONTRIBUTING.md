# CONTRIBUTING — 우리가 일하는 법

## 처음 한 번
```bash
git config core.hooksPath .githooks   # 비밀값·연락처 커밋 차단
```

## 브랜치 · 커밋
- `main`은 언제나 빌드된다. 작업은 `feat/…` `fix/…` 브랜치 → PR → 다른 한 사람이 확인 후 병합.
- 커밋 메시지: [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) — `feat:` `fix:` `docs:` `test:` `refactor:` `chore:`
- 마지막 줄 트레일러:
  - `Prompt-Ref: P##` — AI가 만든 변경. 번호는 팀 프롬프트 기록의 지시 번호.
  - `Human-Only: true` — 사람이 직접 한 변경.

## AI를 쓸 때
- AI는 [AGENTS.md](AGENTS.md)를 먼저 읽는다.
- AI가 쓴 코드는 사람이 실행해 보고 병합한다. 설명할 수 없는 코드는 병합하지 않는다.
- AI가 만든 이미지·영상에는 "AI 생성"과 도구 이름.
- 자세히: [07 AI 협업](docs/07-ai-collaboration.md)

## 결정이 필요할 때
선택지가 둘 이상이고 나중에 "왜?"라고 물을 만하면 ADR: [docs/adr/](docs/adr/)

## 릴리스
1. `versionName`·`versionCode` 올림, [CHANGELOG.md](CHANGELOG.md) 갱신
2. `./gradlew :app:assembleRelease` → `apk/망상궤도_⟨TBD⟩_release.apk`
3. 에뮬레이터에 설치해 [시나리오](docs/05-demo.md#시나리오) 통과 확인
4. 태그 `vX.Y.Z` + GitHub Releases에 APK 첨부
