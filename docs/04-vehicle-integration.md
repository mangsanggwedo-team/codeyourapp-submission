# 04 차량 연동: HOW (차량)
> 심사 항목: **차량 특화성** · **기술 활용성** (SDK를 핵심 기능에 쓰는가)

## 쓰는 차량 신호
| 신호 | Pleos SDK | 언제 읽나 | 앱이 하는 일 | 코드 |
|---|---|---|---|---|
| 주행 상태 / 기어 | Vehicle (API) | 변화 시 | 주행↔정차 모드 전환 ([SAFETY](../SAFETY.md)) | (링크) |
| 미정 | 미정 | 미정 | 미정 | 미정 |

## 신호가 화면이 되기까지
```mermaid
sequenceDiagram
    participant VC as Virtual Console · adb GPX (시연)
    participant SDK as Pleos SDK (Vehicle · FusedLocation)
    participant DA as 데이터 층
    participant ST as 상태 층
    participant UI as UI · TTS
    VC->>SDK: 기어 변경 · 위치 이동
    SDK-->>DA: 콜백
    DA->>ST: 차량 신호
    ST->>ST: 주행 · 정차 · 주차 판단
    ST->>UI: 모드 전환
    UI-->>UI: 주행이면 음성과 한 줄, 정차면 전체 화면
```

에뮬레이터 한계: Virtual Console은 기어·도어·착좌·배터리·충전·공조·경고등을 바꾼다. 차속 조작은 없어서 이동은 adb/GPX 위치 재생으로 흉내 낸다. 실차에선 차속 신호를 쓴다.

## 쓸 수 있는 SDK (공식 공지 기준)
- 공개 문서에 있는 Pleos SDK만 쓴다. Pleos LLM SDK는 제공되지 않는다.
- 차량 마이크 음성을 외부 음성 인식 서비스로 보내지 않는다. 음성은 Pleos STT로.

## 권한
매니페스트 선언 목록: 미정, 공모전 개발에선 Vehicle·NaviHelper·STT·TTS·FusedLocation이 선언만으로 사용 가능(2026-10-28 설명회).

## 지원 여부 확인
기능을 쓰기 전 SDK의 `checkXxxCapabilities` 계열 API로 차량이 지원하는지 확인하고, 없으면 아래 "신호가 없을 때" 동작으로 내려간다(설명회 화면 API policy).

## 신호가 없을 때
| 상황 | 동작 |
|---|---|
| 신호 미수신 | 주행 중으로 간주(안전 기본값) |
| 미정 | 미정 |

→ 다음: [05 시연](05-demo.md)
