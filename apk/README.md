# apk: 심사용 실행 파일

공모전 규칙: APK는 이 폴더에 `팀명_앱이름_release.apk`로 둔다.

| 파일 | 버전 | 빌드 날짜 | 서명 |
|---|---|---|---|
| `망상궤도_룸19_release.apk` | 0.2.0 (versionCode 2) | 2026-11-15 | 테스트용 debug 키 (심사·에뮬레이터 설치용) |

설치: `adb install 망상궤도_룸19_release.apk` → 주차(P) 상태에서 앱을 열고 **머물기**를 한 번 누른다.
짧게 보기: `adb shell am start -n com.mangsang.app/.MainActivity --ei sec 200` (세션 길이를 200초로 줄인다)
무엇이 되고 무엇이 아직인지: [MLP 점검](../docs/app/MLP_점검.md) · 시나리오: [05 시연](../docs/05-demo.md)
다시 만들기: `./gradlew :app:assembleRelease` (이 폴더로 자동 복사)
