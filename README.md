<!-- ⟨TBD⟩ 표시는 11/14 아이디어 결정 후 채운다. grep "⟨TBD⟩"로 남은 칸을 찾는다. -->
<!-- ⟨TBD⟩ 배너가 생기면 주석 해제
<p align="center">
  <img src="docs/assets/banner.png" alt="⟨TBD 앱 이름⟩" width="720">
</p>
-->

<p align="center">
  <a href="#실행-방법"><strong>실행 방법</strong></a> ·
  <a href="docs/README.md"><strong>문서</strong></a> ·
  <a href="docs/05-demo.md"><strong>시연 시나리오</strong></a> ·
  <a href="apk/"><strong>APK</strong></a> ·
  <a href="⟨TBD 시연 영상 링크⟩"><strong>시연 영상</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Pleos%20Connect-6D4AFF" alt="Pleos Connect">
  <img src="https://img.shields.io/badge/Android-Kotlin-3DDC84" alt="Kotlin">
  <img src="https://img.shields.io/badge/Hyundai%20Motor%20Group-Code%20your%20App%202026-002C5F" alt="Code your App 2026">
</p>

<!-- ⟨TBD⟩ 시연 GIF가 생기면 주석 해제
<p align="center"><img src="docs/assets/demo.gif" alt="시연" width="600"></p>
-->

# ⟨TBD 앱 이름⟩ — ⟨TBD 한 줄 소개⟩

**⟨TBD 비유 한 줄: "○○가 ~라면, 우리는 ~다"⟩**

| 앱 이름 | 한 줄 소개 | 테스트 환경 | APK | 실행 |
|---|---|---|---|---|
| ⟨TBD⟩ | ⟨TBD⟩ | Pleos Connect 에뮬레이터 · Android Studio ⟨TBD 버전⟩ | [`apk/`](apk/) · Releases | [아래](#실행-방법) |

## 이런 순간을 위해 만들었다
| 지금 차 안에서는 | ⟨TBD 앱 이름⟩과 함께라면 |
|---|---|
| ❌ ⟨TBD⟩ | ✅ ⟨TBD⟩ |
| ❌ ⟨TBD⟩ | ✅ ⟨TBD⟩ |
| ❌ ⟨TBD⟩ | ✅ ⟨TBD⟩ |

→ 문제를 어떻게 찾았나: [01 문제](docs/01-problem.md)

## 심사 기준 대응표
| 심사 항목 | 우리의 답 | 증거 |
|---|---|---|
| **차량 특화성** | ⟨TBD⟩ | [04 차량 연동](docs/04-vehicle-integration.md) · 시연 ⟨TBD 0:00⟩ |
| **창의성** | ⟨TBD⟩ | [01 문제](docs/01-problem.md) · [02 해법](docs/02-solution.md) |
| **기술 활용성** | ⟨TBD⟩ | [03 구조](docs/03-architecture.md) · [04 차량 연동](docs/04-vehicle-integration.md) |
| **사업성** | ⟨TBD⟩ | [06 사업](docs/06-business.md) · [ROADMAP](ROADMAP.md) |
| 개발 산출물 | 실행되는 APK · 시연 영상 · 이 저장소 | [05 시연](docs/05-demo.md) · [추적표](docs/05-demo.md#추적표) |

## 어떻게 동작하나
```
 ┌──────────── 차량 (Pleos Connect) ────────────┐
 │  주행 상태 · 속도 · 기어 · 위치 · 음성(STT/TTS) │
 └───────────────────────┬──────────────────────┘
                         │ Pleos SDK
                ┌────────▼────────┐
                │  ⟨TBD 앱 이름⟩    │   주행 중: 음성·글랜스 2초 이내
                │  상태 판단 → 경험  │   정차 중: 화면 전체 사용
                └────────┬────────┘
                         ▼
               화면 · 음성 · ⟨TBD⟩
```
→ 자세히: [03 구조](docs/03-architecture.md) · 쓰는 차량 신호 전체: [04 차량 연동](docs/04-vehicle-integration.md) · 안전 원칙: [SAFETY](SAFETY.md)

## 실행 방법
1. Android Studio ⟨TBD 버전⟩ + Pleos Connect 에뮬레이터 준비 → [05 시연 · 준비](docs/05-demo.md#준비)
2. `apk/망상궤도_⟨TBD⟩_release.apk`를 에뮬레이터에 설치 (`adb install`) — 또는 `./gradlew :app:installDebug`
3. Virtual Console로 시나리오 재현 → [05 시연 · 시나리오](docs/05-demo.md#시나리오)

## ⟨TBD 앱 이름⟩이 아닌 것
| | |
|---|---|
| **⟨TBD⟩가 아니다.** | ⟨TBD — 범위를 스스로 자른 이유⟩ |
| **주행 중 화면을 보게 하는 앱이 아니다.** | 주행 중엔 음성과 2초 글랜스만. [SAFETY](SAFETY.md) |

## 만든 사람들
**망상궤도** — 김주용(PM · ⟨TBD 역할⟩) · 김민주(⟨TBD 역할⟩). 두 사람이 여러 AI와 역할을 나눠 만들었고, 모든 결정과 검증은 사람이 했다 → [07 AI 협업](docs/07-ai-collaboration.md)

<sub>2026 현대자동차그룹 Pleos 'Code your App' 공모전 출품작 · [LICENSE](LICENSE)</sub>
