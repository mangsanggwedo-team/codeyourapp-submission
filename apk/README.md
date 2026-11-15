# apk: 심사용 실행 파일

공모전 규칙: APK는 이 폴더에 `팀명_앱이름_release.apk`로 둔다.

| 파일 | 버전 | 빌드 날짜 | 서명 |
|---|---|---|---|
| `망상궤도_룸19_release.apk` | 0.3.0 (versionCode 3) | 2026-11-16 | 테스트용 debug 키 (심사·에뮬레이터 설치용) |

설치: `adb install 망상궤도_룸19_release.apk` → 실행 아이콘 **Room19**. 처음 열면 소개와 세 걸음 설정이 나오고, 주차(P) 상태에서 **머물기**를 한 번 누른다.
시연 패널: 왼쪽 위 ROOM 19 글자를 길게 누르면 빠르게 보기(×10)와 문제 상황 세 가지(기어 이탈, 문 열림·전화, 등받이 거부)를 흉내 낼 수 있다.
짧게 보기: `adb shell am start -n com.mangsang.app/.MainActivity --ei sec 200` (세션 길이를 200초로 줄인다)
무엇이 되고 무엇이 아직인지: [MLP 점검](../docs/app/MLP_점검.md) · 시나리오: [05 시연](../docs/05-demo.md)
다시 만들기: `./gradlew :app:assembleRelease` (이 폴더로 자동 복사)
