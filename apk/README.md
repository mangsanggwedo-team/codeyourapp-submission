# apk: 심사용 실행 파일

공모전 규칙: APK는 이 폴더에 `팀명_앱이름_release.apk`로 둔다.

| 파일 | 버전 | 빌드 날짜 | 서명 |
|---|---|---|---|
| `망상궤도_골방_release.apk` | 0.1.0 (versionCode 1) | 2026-11-15 | 테스트용 debug 키 (심사·에뮬레이터 설치용) |

설치: `adb install 망상궤도_골방_release.apk` → 시나리오는 [05 시연](../docs/05-demo.md)
다시 만들기: `./gradlew :app:assembleRelease` (이 폴더로 자동 복사)
