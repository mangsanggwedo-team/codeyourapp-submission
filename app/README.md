# app: Android 소스

아이디어 확정 후 팀의 검증된 틀로 생성한다(모의 출품 '틈', 2026-11-09 CLI 빌드·테스트·에뮬레이터 실동작 확인).
- 모듈: `:core` 순수 Kotlin 판단 규칙 + JUnit · `:app` Compose + Pleos SDK. [03 구조](../docs/03-architecture.md)
- 의존성: Pleos 공식 Maven, `ai.pleos.playground:Vehicle:2.3.2`. 버전은 `gradle/libs.versions.toml` 한 곳에서.
- Pleos 공식 샘플([Pleos-Playground](https://github.com/Pleos-Playground))은 라이선스가 명시되지 않아 코드를 복사하지 않고 구조만 참고한다.
