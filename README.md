<!-- 배너가 생기면 주석 해제 (다크/라이트 두 장)
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.png">
    <img src="docs/assets/banner-light.png" alt="앱 이름" width="720">
  </picture>
</p>
-->

<p align="center">
  <a href="https://mangsanggwedo-team.github.io/codeyourapp-submission/site/"><strong>소개 페이지</strong></a> ·
  <a href="#실행-방법"><strong>실행 방법</strong></a> ·
  <a href="docs/README.md"><strong>문서</strong></a> ·
  <a href="docs/05-demo.md"><strong>시연 시나리오</strong></a> ·
  <a href="apk/"><strong>APK</strong></a> ·
  <a href="ai/README.md"><strong>AI 협업</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Pleos%20Connect-v2.1.0%20·%20API%2034-6D4AFF" alt="Pleos Connect v2.1.0, API 34">
  <img src="https://img.shields.io/badge/Kotlin-Android-3DDC84" alt="Kotlin Android">
  <a href=".github/workflows/ci.yml"><img src="https://github.com/mangsanggwedo-team/codeyourapp-submission/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

# 골방 (가제): 주차한 차가 잠깐 나만의 골방이 된다

**집에 들어가기 전에도, 일하다 기도 시간이 됐을 때도, 주차한 차 안의 몇 분을 휴대폰이 아니라 기도와 고요한 머묾으로.** 차가 먼저 묻고, 문을 닫고, 방해하지 않고, 끝날 때를 알아채 조용히 돌려놓는다.

> **심사위원이 3분 안에 볼 것**
> 1. [여정 시뮬레이션](sim/journey/index.html): 브라우저로 열면 시나리오 A(귀가 직전 기도 15분)가 재생된다
> 2. [초정밀 여정](docs/journey/여정_초정밀.md)과 [베이지안 마침 모델](docs/journey/마침_모델.md): 마치기 버튼 없이 끝나는 이유
> 3. [근거](docs/research/): 원문 대조로 검증한 통계와 APA 참고문헌
> 4. 코드: [`:core` EndingPolicy](core/src/main/kotlin/com/mangsang/app/core/EndingPolicy.kt) (테스트 10개 통과), [차량 제어 실측](docs/04-vehicle-integration.md#제어-실측-2026-11-15)

| 앱 이름 | 한 줄 소개 | 테스트 환경 | APK | 실행 |
|---|---|---|---|---|
| 골방 (가제) | 주차한 차를 짧은 기도·고독의 공간으로 바꾸고 되돌린다 | Pleos Connect 에뮬레이터 v2.1.0 (API 34) · 2560x1440 | [`apk/`](apk/) · Releases | [실행 방법](#실행-방법) |

<!-- 시연 GIF가 생기면 주석 해제
<p align="center"><img src="docs/assets/demo.gif" alt="시연 15초" width="600"><br>
<sub>Pleos Connect v2.1.0 · API 34 · Virtual Console로 기어 P → D</sub></p>
-->

## 이런 순간을 위해 만들었다
| 지금 차 안에서는 | 이 앱과 함께라면 |
|---|---|
| ❌ (아이디어 확정 후) | ✅ |

문제를 어떻게 찾았나: [01 문제](docs/01-problem.md)

## 심사 기준 대응표
| 심사 항목 | 우리의 답 | 증거 |
|---|---|---|
| **차량 특화성** | 주행·정차·주차 세 순간마다 다르게 동작한다 | [DESIGN 상태도](DESIGN.md) · [04 차량 연동](docs/04-vehicle-integration.md) |
| **창의성** | (아이디어 확정 후) | [01 문제](docs/01-problem.md) · [02 해법](docs/02-solution.md) |
| **기술 활용성** | Pleos SDK 신호가 핵심 기능의 입력이다 | [03 구조](docs/03-architecture.md) · [04 SDK 표](docs/04-vehicle-integration.md) |
| **사업성** | (아이디어 확정 후) | [06 사업](docs/06-business.md) · [ROADMAP](ROADMAP.md) |
| 개발 산출물 | 실행되는 APK, 시연 영상, 추적 가능한 저장소 | [05 시연 · 추적표](docs/05-demo.md#추적표) · [STATS](STATS.md) |

## 어떻게 동작하나
```mermaid
stateDiagram-v2
    direction LR
    state "주차: 화면 전체" as P
    state "정차: 화면 + 음성" as S
    state "주행: 음성 + 한 줄" as D
    [*] --> P
    P --> S: 기어 D
    S --> D: 이동 시작
    D --> S: 이동 멈춤
    S --> P: 기어 P
```
차량 신호가 바뀌면 앱이 먼저 물러난다. 주행 중엔 음성과 2초 안에 읽히는 한 줄만. 신호가 끊기면 주행 중으로 간주한다. 근거: [SAFETY](SAFETY.md) · 구조: [03 구조](docs/03-architecture.md)

## 설계 한눈에
골방이 어떻게 움직이는지 그림 여덟 장으로 본다. 시간과 밝기 값은 팀이 정한 초깃값이다.

| 그림 | 한 줄 |
|---|---|
| [![세션 상태](docs/assets/models/05_세션_상태.png)](docs/assets/models/05_세션_상태.png) | **세션 상태.** 사용자가 누르는 것은 머물기 한 번이고, 나머지는 차가 여섯 단계로 이끈다. |
| [![사용자 여정 지도](docs/assets/models/01_사용자_여정_지도.png)](docs/assets/models/01_사용자_여정_지도.png) | **사용자 여정.** 귀가 직전 지하주차장의 15분을 사람, 차, 화면 순으로 따라간다. |
| [![구성 요소](docs/assets/models/03_구성_요소.png)](docs/assets/models/03_구성_요소.png) | **구성 요소.** 핵심 로직 하나를 차량판과 휴대폰 간이판이 함께 쓴다. |
| [![데이터 흐름](docs/assets/models/04_데이터_흐름.png)](docs/assets/models/04_데이터_흐름.png) | **데이터 흐름.** 모든 판단은 기기 안에서 끝나고, 앱이 밖으로 보내는 것은 없다. |
| [![화면 흐름](docs/assets/models/10_화면_흐름_에뮬레이터.png)](docs/assets/models/10_화면_흐름_에뮬레이터.png) | **화면 흐름.** 에뮬레이터 화면 배치 그대로, 홈에서 골방으로 갔다가 다시 홈으로 온다. |
| [![시퀀스 문턱](docs/assets/models/06_시퀀스_문턱.png)](docs/assets/models/06_시퀀스_문턱.png) | **들어설 때.** 원래 값을 먼저 적어 두고, 차를 바꾸고, 확인한 다음에야 종이 울린다. |
| [![시퀀스 마침](docs/assets/models/07_시퀀스_마침.png)](docs/assets/models/07_시퀀스_마침.png) | **마칠 때.** 끝을 묻지 않는다. 빛부터 천천히 올리고 말은 한 번만 한다. |
| [![사업 모델 11블록](docs/assets/ddbm_canvas.png)](docs/assets/ddbm_canvas.png) | **사업 모델.** 기도는 무료, 앱 마켓에 먼저 올리고, 심화 기능만 구독으로 받는다. |

## 세 순간의 화면
<!-- 캡처가 생기면 표로: | 주행 | 정차 | 주차 | 캡션에 캡처 조건 (DESIGN 4절) -->
(앱 구현 후 캡처)

## 이 앱이 아닌 것
| | |
|---|---|
| **주행 중 화면을 보게 하는 앱이 아니다.** | 주행 중엔 음성과 2초 글랜스만. [SAFETY](SAFETY.md) |
| (아이디어 확정 후) | 범위를 스스로 자른 이유는 [docs/adr/](docs/adr/) |

## 지금 어디까지
| 상태 | 무엇 |
|---|---|
| 끝남 | 문제 조사, 저장소 설계, 안전 원칙, 구조 설계, 앱 골격(주차·정차·주행 판단이 에뮬레이터에서 SDK로 동작) |
| 진행 중 | 아이디어 결정 (2026-11-14), 1차 기획서 (2026-11-15) |
| 계획 | 앱 구현, 시연 영상, 2차 PT (2026-12-03) · [ROADMAP](ROADMAP.md) |

---

## 심사위원·개발자용

### 실행 방법
> [!IMPORTANT]
> Pleos Connect 에뮬레이터 **v2.1.0** (API 34)에서 확인했다. 첫 실행은 Cold boot.

```bash
# 1. 에뮬레이터: Device Manager > Automotive > Pleos Connect v2.1.0, Cold boot
# 2. 설치
adb install apk/망상궤도_앱이름_release.apk
# 3. 차량 상태 바꾸기: bash scripts/vc.sh drive 40 (가속) · stop · park, 시나리오는 docs/05-demo.md
```

<details>
<summary>에뮬레이터가 안 뜰 때</summary>

[05 시연 · 막혔을 때](docs/05-demo.md#막혔을-때)
</details>

### 테스트 환경
| 항목 | 값 |
|---|---|
| 에뮬레이터 · 화면 규격 | Pleos Connect v2.1.0 · Android API 34 · 2560x1440 (160dpi) |
| 차량 신호 조작 | Virtual Console (기어·도어·착좌·배터리·공조·경고등), 위치는 adb GPX |
| Android Studio · JDK · Kotlin | 앱 골격 생성 후 기입 |

### APK
| 파일 | 위치 |
|---|---|
| `망상궤도_앱이름_release.apk` | [`apk/`](apk/) · GitHub Releases |

### 저장소 지도
| 어디 | 무엇 |
|---|---|
| [docs/](docs/README.md) | 01 문제 → 02 해법 → 03 구조 → 04 차량 연동 → 05 시연 → 06 사업, 결정 기록 |
| [docs/07](docs/07-process.md) | 만드는 방식: 일정, 결정, 품질 문, 위험 관리 |
| [ai/](ai/README.md) | 두 사람이 AI와 일한 방식: 에이전트, 장치(하네스), 지시 기록, 사람이 뒤집은 제안 |
| [ai/toolchain](ai/toolchain.md) · [.agents/skills](.agents/skills/README.md) | 쓴 도구 전부: 플러그인 17, 팀 스킬 9, 에이전트 5, 로컬 도구, 관리 규칙 |
| [DESIGN](DESIGN.md) · [SAFETY](SAFETY.md) | 경험의 규칙, 운전자 안전 |
| [STATS](STATS.md) | 다시 셀 수 있는 숫자 |
| [AGENTS.md](AGENTS.md) | AI 도구가 이 저장소를 읽는 입구 |

### 만든 사람들
**망상궤도**: PM, 디자이너. 결정과 검증은 사람이, 초안과 반복 작업은 AI가 했다. [ai/](ai/README.md)

<sub>2026 현대자동차그룹 Pleos 'Code your App' 출품작 · [LICENSE](LICENSE) · [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES.md)</sub>
