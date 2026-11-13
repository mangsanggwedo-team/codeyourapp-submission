# 03 구조: HOW
> 심사 항목: **기술 활용성**

## Context: 앱과 바깥
```
 [운전자·동승자] ──음성/터치──► [(앱)] ◄──Pleos SDK──► [Pleos Connect 차량]
                                      │
                                      └──► [(외부 API, 없으면 삭제)]
```

## Container: 앱 안
| 층 | 책임 | 위치 |
|---|---|---|
| UI | 주행 상태별 화면·음성 | `app/src/main/…/ui/` 미정 |
| 상태 | 차량 신호 → 앱 상태(주행/정차/주차) | `…/state/` 미정 |
| 데이터 | SDK 래퍼 · 로컬 저장 | `…/data/` 미정 |

단방향 데이터 흐름(UDF): 차량 신호 → 상태 → UI. Google [앱 아키텍처 가이드](https://developer.android.com/topic/architecture) 기준. 단일 모듈, 공모전 규모에서 모듈 분리는 이득보다 비용이 크다(adr에 기록).

## 기술 선택
| 무엇 | 선택 | 이유 |
|---|---|---|
| 언어 | Kotlin | Pleos 샘플·SDK 기준 |
| UI | (Compose/View) | 미정 |

→ 다음: [04 차량 연동](04-vehicle-integration.md)
