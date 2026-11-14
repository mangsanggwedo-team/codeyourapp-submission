---
name: risk-compliance
description: Pleos "Code your App" 차량 앱의 안전·규정 점검. 운전자 주의분산(주행 중 글랜스 2초·합계 12초), 차량 마이크 음성 외부 STT 금지(공지 N8), 공개 SDK만 사용, 개인정보·차량 데이터 경계를 기능별로 따진다. 기능 설계·기획서 작성·제출 직전에. 트리거: "안전 점검", "주의분산", "규정 위반", "개인정보", "리스크", "risk".
---

# risk-compliance: 차량 앱 안전·규정 점검

법률 자문이 아니다. 모르는 규정은 지어내지 않고 [확인 필요]로 둔다.

## 먼저 읽기
- `docs/judging/심사기준.md` (N8 공지, 7절 설명회와 공지 차이)
- 제출 저장소 `SAFETY.md` (https://github.com/mangsanggwedo-team/codeyourapp-submission/blob/main/SAFETY.md)
- `docs/product/user-journey.md`, `docs/architecture/data-model.md`

## 순서
1. 기능마다 주행 중 / 정차 중 / 탑승 전후 중 언제 쓰이는지 나눈다.
2. 주행 중 기능은 주의분산 한도로 점검한다.
   - 한 번 보기 2초 이내, 한 작업 응시 합계 12초 이내 (NHTSA Visual-Manual Guidelines 2013)
   - 핵심 작업 3탭 이하, 글 1~3줄·120자 이하, 영상·긴 글·키보드 입력 금지 (Android for Cars)
   - 주행 상태는 Vehicle SDK 신호로 판단, 판단 실패 시 주행 중으로 간주 (fail-closed)
3. 대회 규칙 점검 (N8)
   - 공개 문서에 있는 SDK만: Vehicle, NaviHelper, TextToSpeech, SpeechToText, FusedLocation, Gleo Interface. 미공개 SDK·Pleos LLM SDK 전제 기능 금지(향후 계획으로만 기재)
   - 차량 마이크 음성을 외부 음성 인식으로 보내지 않는다. 음성 인식은 SpeechToText SDK만
4. 데이터 분류: 위치·음성·차량 신호·탑승자 정보마다 쓰는 이유, 보관 위치·기간, 외부 전송 여부. 원본 위치 기록은 남기지 않고, 외부 전송은 사용자가 켠 경우만.
5. 외부 API 경계와 라이선스(폰트·이미지·라이브러리)를 적는다.
6. 리스크 표를 쓰고 남은 위험과 담당을 정한다.

## 리스크 표
| ID | 기능 | 상황(주행/정차) | 위험 | 막는 방법 | 확인 방법(시연·코드) | 담당 | 남은 위험 |
|---|---|---|---|---|---|---|---|

## 멈출 때 (fail-closed)
주행 상태를 모름 · 외부 STT 경로가 보임 · 문서에 없는 SDK를 씀 · 개인정보가 기기 밖으로 나가는데 사용자 동의가 없음. 이 중 하나라도 있으면 기능을 "완료"로 두지 않는다.

## 결과물
- 제출 저장소 `SAFETY.md` 1·2절 갱신 (데이터 표의 "미정" 채우기)
- 기획서 안전 문단, `eval-design` 의 위험 사례

출처: River-181/harness-engineering-skills (MIT) `skills/risk-compliance/SKILL.md`, 2026-11-14 이식·수정
