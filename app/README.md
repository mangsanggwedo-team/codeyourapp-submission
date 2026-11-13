# app: Android 소스

아이디어 확정(11/14) 후 Android Studio로 생성한다. 기준:
- Pleos 공식 샘플([Pleos-Playground](https://github.com/Pleos-Playground))과 같은 단일 모듈 Gradle(Kotlin DSL) 구성, 샘플은 라이선스가 명시되지 않아 코드를 복사하지 않고 구조만 따른다.
- 의존성 버전은 `gradle/libs.versions.toml`(버전 카탈로그) 한 곳에서.
- 패키지: `ui/` · `state/` · `data/`, [03 구조](../docs/03-architecture.md)와 같은 이름.
