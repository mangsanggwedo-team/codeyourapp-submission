---
name: pleos-app-scaffold
description: 아이디어가 정해지면 Pleos Connect 앱 골격을 제출 저장소에 세우고, 에뮬레이터에서 Virtual Console을 스크립트로 조작해 화면을 자동 캡처한다. 트리거: "앱 골격", "앱 만들기 시작", "에뮬레이터 시연", "Virtual Console 스크립트", "APK 빌드".
---

# pleos-app-scaffold: 검증된 틀에서 앱 시작

틀 = 모의 출품 '틈'(`~/Projects/teum-pleos`, GitHub River-181/teum-pleos 비공개). 2026-11-09 Android Studio 없이 CLI로 빌드·테스트 28/28·release APK·에뮬레이터 실동작까지 확인. 2026-11-13 오프라인 테스트 재확인.

## 이 맥의 준비물 (2026-11-13 확인)
| 항목 | 상태 |
|---|---|
| JDK 17 · Android SDK(platforms 34, build-tools 34/35) · adb | 있음 |
| 에뮬레이터 37.2 + AVD `Pleos_Connect` (v2.1.0, 2560x1440, arm64) | 있음 |
| Gradle | 래퍼(`./gradlew`)로. 별도 설치 불필요 |
| Android Studio | **없음**. CLI로 충분. 레이아웃 미리보기가 필요하면 사람이 설치 |

## 골격 세우기 (제출 저장소에서)
1. 틈에서 복사: `gradlew gradlew.bat gradle/ settings.gradle.kts build.gradle.kts gradle.properties`, `core/`와 `app/`의 빌드 파일·매니페스트. 도메인 코드는 버리고 패키지명을 새 앱으로(`com.mangsang.<앱>`).
2. 구성은 틈과 같게: `core/` 순수 Kotlin 도메인 + JUnit (안드로이드 없이 테스트) · `app/` Compose + Pleos SDK. 판단 로직은 core에 둔다 = 테스트 가능 = 심사 "기술 활용성" 증거.
3. 의존성 핵심: Pleos Maven `https://nexus-playground.pleos.ai/repository/maven-releases/` (인증 없음), `ai.pleos.playground:Vehicle:2.3.2` (2.3.1은 내려감). 다른 SDK(NaviHelper·STT·TTS·FusedLocation)는 버전을 Maven에서 확인 후.
4. 매니페스트: `uses-feature android.hardware.type.automotive required=true`, 권한 `pleos.car.permission.CAR_DRIVE` 등 쓰는 것만(선언만으로 사용 가능, 2026-10-28 설명회).
5. `local.properties`(sdk.dir)는 커밋하지 않는다.
6. `./gradlew :core:test :app:assembleDebug` 초록 → 커밋.

## 에뮬레이터와 Virtual Console 자동화
```bash
S=~/Library/Android/sdk
$S/emulator/emulator -avd Pleos_Connect -no-snapshot-load &   # Cold boot
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb forward tcp:8088 tcp:8088                                   # Virtual Console HTTP
vc(){ curl -s -o /dev/null -X PUT "http://127.0.0.1:8088$1"; }
vc "/vehicle/gear?gear=Drive"; vc "/vehicle/seat?kind=occupied&value=true&area=driver"
adb exec-out screencap -p > docs/assets/screens/01_driving.png
```
- 틈의 `docs/emulator/vc.sh` · `virtual_console_scenario.sh`(장면별 조작+캡처) · `live_demo.sh`(라이브 시연, 세션 하트비트 `POST /browser/session`)를 그대로 본떠 쓴다.
- 차속 조작은 없다. 이동은 adb GPX/위치로.
- 알려진 함정: 좌석 착좌 값이 반전되어 들어온 적 있음(틈 커밋 474c7cc). 신호마다 에뮬레이터에서 실제 값 확인.
- 캡처 캡션에 조건(에뮬레이터 버전·API·해상도·VC 값)을 적는다 (제출 저장소 DESIGN 4절).

## 릴리스
`./gradlew :app:assembleRelease` → `apk/망상궤도_<앱>_release.apk` → 에뮬레이터 설치 확인 → Releases. 상세: 제출 저장소 CONTRIBUTING.
