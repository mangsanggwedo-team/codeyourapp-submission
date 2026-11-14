# 재현 무대 (웹 시뮬레이터)

한국 학원가 앞 반경 50m 디오라마 위에서 차를 움직이고, 같은 상태를 Pleos 에뮬레이터(Virtual Console)로 보낸다.
화면 라벨대로 이것은 **웹 시뮬레이터 화면이고 실제 차가 아니다.** 판단 규칙은 앱(`:core`)에만 있고, 무대는 차가 어떻게 움직이는지만 다룬다.

## 실행
```bash
cd sim
npm install
npm run dev            # http://localhost:5173
scripts/fetch-hdri.sh  # (선택) Poly Haven HDRI 3장을 public/hdri/ 에 받는다. 없으면 반구광만으로 돈다
npm test               # 연결기 순수 로직 자체 검사
npm run check          # 타입 검사
```

## 새 컴퓨터에서 처음 (팀원용, 약 30분)
1. 준비물: Node.js 20 이상, Git, Android Studio(SDK Platform-Tools 포함).
2. 받기: `git clone https://github.com/mangsanggwedo-team/codeyourapp-submission.git && cd codeyourapp-submission/sim && npm install`
3. Pleos Connect 에뮬레이터 만들기: Pleos Playground 문서의 에뮬레이터 안내대로 Android Studio SDK Manager에 시스템 이미지 사이트를 추가한다.
   - Mac(Apple 칩): `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-arm64-sys-img.xml`
   - Windows·Linux: `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-sys-img.xml`
   - 이미지를 받고 AVD를 만든다. 이름을 `Pleos_Connect`로 하면 아래 명령이 그대로 돈다(다르면 `AVD=이름 npm run emu`).
4. 터미널 1: `npm run dev` → 브라우저 `http://localhost:5173`
5. 터미널 2: `npm run emu` (에뮬레이터 켜기, 8088 연결, 화면 복사) → 무대 위 **연결**.
6. 에뮬레이터 없이도 무대·조작·자율주행은 그대로 돈다. 연결 칸만 비어 있다.

## 에뮬레이터와 잇기
1. Pleos Connect 에뮬레이터를 켠다. `adb forward tcp:8088 tcp:8088`
2. 화면 위 **에뮬레이터 연결**을 누른다 (또는 `http://localhost:5173/?connect=1`).
   - 1초마다 `POST /browser/session?client=mangsang-sim` 하트비트 → 콘솔 브리지가 준비된다(콘솔 페이지를 따로 열 필요 없음, 11/14 실측).
   - 상태 값이 바뀔 때만 `PUT /vehicle/*`, 묶음 전송은 초당 최대 5회. 0.5초마다 `GET /vehicle/state`로 읽어 텔레메트리 표에 놓는다.
   - 연결이 끊겨도 무대는 계속 돈다.
3. 다른 터미널에서 `npm run emu`: 에뮬레이터가 꺼져 있으면 켜고, `adb forward tcp:8088` 을 걸고, 화면을 1초마다 오른쪽 아래 칸에 복사한다. 그다음 무대에서 **연결**.

## 화면
| 칸 | 내용 |
|---|---|
| 가운데 | 심 방식: 등각 디오라마(직교, 45°/30°, 90° 회전, 40m/110m) · 운전 방식: 운전석 시점 |
| 오른쪽 위 | 다른 쪽 시점 + 계기판. 더블클릭하면 운전석 → 추적 → 보행자 시점 |
| 오른쪽 가운데 | 텔레메트리: 넣은 값 · 보낸 값 · 에뮬레이터 값 · PUT 왕복 ms (초록 일치, 빨강 불일치) |
| 오른쪽 아래 | Pleos 에뮬레이터 화면 자리. 같은 그림이 운전석 시점의 차 중앙 디스플레이에도 뜬다 |
| 왼쪽 | 조작판 (심 방식) 또는 키 안내 (운전 방식) |

각 칸의 **↗ 새 창**은 같은 상태를 BroadcastChannel로 받는 별도 창을 연다(`?view=diorama|driver|chase|pedestrian|telemetry`). 물리·자율·연결기는 처음 연 메인 창에서만 돈다. 새 창에서 누른 키도 메인 창으로 간다.

## 조작
- **심 방식**: 기어, 문 4·창문 4·트렁크·프렁크·잠금, 착좌 4, 방향지시·비상등·전조등·상향등, 공기압 4·ABS·TPMS 경고등, 무드등, 자율주행(켜기·목표 속도·**목표 지점 찍기**: 버튼 누르고 디오라마 바닥 클릭).
- **운전 방식**: `↑` 가속 `↓` 브레이크 `Space` 급제동 `←→` 핸들 `Q`/`E` 깜빡이 `H` 비상등 `P R N D` 기어.
- **자율주행**: 차선 중심 따라가기, 깜빡이를 켜면 그쪽 차로로 바꾸고 끝나면 깜빡이를 끈다, 빨강·노랑 신호에서 정지선 앞에 선다, 같은 차로 앞에 선 차(학원 버스) 뒤에 선다. 사람이 `↓`/`Space`를 누르면 해제.

## 구조
```
src/state.ts                 상태 저장소 하나 (Virtual Console 이름에 맞춘 차 상태)
src/drive.ts                 운전 주체: 키보드 · 자율 (운동학 자전거 모델)
src/bridge/pleos/            현대차 공식 Virtual Console 호출부만 (channels.ts 경로·읽기, connector.ts 하트비트·전송·읽기)
src/scene/theme.ts           치수 상수(1 단위 = 1m) · 낮/황혼/밤 팔레트 · 카메라 프리셋 (아트 디렉션)
src/scene/stage.ts           무대 (코드로 생성, 외부 모델 없음)
src/scene/car.ts             주인공 차 (상표 없는 일반형 EV, 부품 노드 이름 = VC 키)
src/ui/                      조작판 · 계기판 · 텔레메트리 · 스타일
docs/vehicle-data-map.md     카탈로그 63개 → 3D 표현 → 상태 키 → 경로
docs/STATUS.md               되는 것 · 안 되는 것 · 다음
```
출처 구분: 현대차 공식(Virtual Console API)은 호출부만 `src/bridge/pleos/`에, 제3자 라이브러리·에셋은 [THIRD-PARTY.md](THIRD-PARTY.md). 나머지는 팀 코드.
