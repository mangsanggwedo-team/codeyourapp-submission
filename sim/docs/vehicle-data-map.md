---
title: 차량 데이터 ↔ 3D 매핑표 (Virtual Console 카탈로그 63개 기준)
updated: 2026-11-14
source: GET /vehicle/catalog 실측 2026-11-14 (현대차 공식 Virtual Console). 경로 필드명은 카탈로그 그대로
---
# 차량 데이터 ↔ 3D 매핑표

- **3D 표현**: 있음 = 무대의 차가 바로 바뀐다 · 계기판 = 운전석 화면 아래 클러스터 HUD · 아직 없음 = 상태 키도 아직 없다.
- **상태 키**: `src/state.ts`의 `car.*`. 상태 저장소 하나가 진실이고, 3D·계기판·연결기가 같은 값을 읽는다.
- **보냄**: 연결기(`src/bridge/pleos/channels.ts`)가 값이 바뀔 때 이 경로로 PUT 한다. 문·창문·트렁크·잠금·무드등은 `/vehicle/body` 한 번으로 묶는다.
- 차속은 카탈로그 기능이 아니지만 설계 12절대로 `/vehicle/controls?speed=` 로 직접 보낸다(무대가 차속을 정함).
- 3D 노드 이름은 VC 키와 같다: `door_fl` `window_fl` `trunk` `frunk` `wheel_fl` `turn_l` `turn_r` `brake` `steering` `seat_driver` `cluster` `app_ring`.

63개 중 3D로 보임 16 · 계기판·조작판만 3 · 아직 없음 44 (공조·좌석 위치·배터리·주행거리·와이퍼·ETCS 등. 아이디어가 정해지면 필요한 것부터 더한다).

| 기능 id | 이름 | 3D 표현 | 상태 키 | Virtual Console 경로 (필드) | 연결기 |
|---|---|---|---|---|---|
| `gear-selection` | Gear Selection | 있음: 계기판 PRND, 바퀴 굴림 방향 | car.gear | `/vehicle/gear` gear | 보냄 |
| `brake-pedal-status` | Brake Pedal | 있음: 브레이크등 | car.brake | `/vehicle/controls` brake | 보냄 |
| `etcs-activated` | ETCS Power | 아직 없음 | - | `/vehicle/etcs` activated | - |
| `etcs-scenario` | ETCS Scenario | 아직 없음 | - | `/vehicle/etcs` scenario | - |
| `power-system-actual` | Power System Actual | 아직 없음 | - | `/vehicle/power-system/simulator` area_id=0&state | - |
| `telltales` | Telltales | 계기판: ABS·TPMS (나머지 종류는 아직 없음) | car.abs / car.tpms | `/vehicle/telltales/simulator` color=Red&type=…&state | 보냄 |
| `notification-1` | Notification 1 | 아직 없음 | - | `/vehicle/notifications/simulator` id=1&display | - |
| `door-pos` | Door Position | 있음: 문 4개 경첩 회전(`door_fl` 등) | car.doors[area] | `/vehicle/body` door_fl/door_fr/door_rl/door_rr | 보냄 |
| `door-lock` | Door Lock | 계기판·조작판만 (3D 표현 없음) | car.locked | `/vehicle/body` doors_locked | 보냄 |
| `trunk-position` | Trunk / Frunk Position | 있음: 트렁크 해치·프렁크 보닛 회전 | car.trunk / car.frunk | `/vehicle/body` frunk/trunk | 보냄 |
| `cruise-control-state` | Cruise Control State | 있음: 자율주행 동작(차선·신호·차로 변경), 계기판 "자율" | car.adMode | `/vehicle/driving-mode` ad_mode_state | 보냄 |
| `cruise-control-target-speed` | Cruise Target Speed | 있음: 자율 목표 속도, 계기판 | car.targetSpeedMps | `/vehicle/driving-mode` target_speed_mps | 보냄 |
| `perf-odometer` | Odometer | 아직 없음 | - | `/vehicle/odometer` traveled_distance_km | - |
| `trip-driving-time` | Trip Driving Time | 아직 없음 | - | `/vehicle/odometer` usage_time_min | - |
| `range-remaining` | Remaining Range | 아직 없음 | - | `/vehicle/odometer` remaining_range_m | - |
| `ev-battery-level` | Battery Energy | 아직 없음 | - | `/vehicle/ev-battery` field=battery_level&value | - |
| `ev-battery-soc` | Battery SOC | 아직 없음 | - | `/vehicle/ev-battery` field=soc&value | - |
| `ev-battery-capacity` | Battery Capacity | 아직 없음 | - | `/vehicle/ev-battery` field=capacity&value | - |
| `ev-charge-current-limit` | Charge Current Limit | 아직 없음 | - | `/vehicle/ev-battery` field=current_limit&value | - |
| `ev-charge-percent-limit` | Charge Percent Limit | 아직 없음 | - | `/vehicle/ev-battery` field=percent_limit&value | - |
| `ev-charge-switch` | Charge Switch | 아직 없음 | - | `/vehicle/ev-battery` field=charge_switch&value | - |
| `ev-charge-port` | Charge Port | 아직 없음 | - | `/vehicle/ev-battery` field=charge_port_open&value | - |
| `tire-pressure` | Tire Pressure | 계기판 4바퀴 kPa(200 미만 노랑), 150 미만이면 타이어가 찌그러져 보임 | car.tireKpa[area] | `/vehicle/tire-pressure` area=…&pressure_kpa | 보냄 |
| `steering-angle` | Steering Angle | 있음: 핸들 회전 + 앞바퀴 조향(14:1) | car.steeringDeg | `/vehicle/controls` steering | 보냄 |
| `steering-wheel-heat` | Steering Wheel Heat | 아직 없음 | - | `/vehicle/steering-wheel-heat` level | - |
| `hvac-power` | HVAC Power | 아직 없음 | - | `/vehicle/hvac` power | - |
| `hvac-ac` | Air Conditioning | 아직 없음 | - | `/vehicle/hvac` ac | - |
| `hvac-auto` | HVAC Auto | 아직 없음 | - | `/vehicle/hvac` auto | - |
| `hvac-dual` | HVAC Dual | 아직 없음 | - | `/vehicle/hvac` dual | - |
| `hvac-recirc` | Air Recirculation | 아직 없음 | - | `/vehicle/hvac` recirc | - |
| `hvac-fan-speed` | Fan Speed | 아직 없음 | - | `/vehicle/hvac` fan_speed | - |
| `hvac-fan-direction` | Fan Direction | 아직 없음 | - | `/vehicle/hvac` driver_direction/passenger_direction | - |
| `hvac-defroster` | Defroster | 아직 없음 | - | `/vehicle/hvac` front_defroster/rear_defroster | - |
| `hvac-temperature-set` | Target Temperature | 아직 없음 | - | `/vehicle/hvac` driver_temp/passenger_temp | - |
| `hvac-seat-temperature` | Seat Temperature | 아직 없음 | - | `/vehicle/hvac` driver_seat/passenger_seat | - |
| `hvac-air-cleaner` | Air Cleaner | 아직 없음 | - | `/vehicle/hvac-air-cleaner` activated | - |
| `cabin-lights-switch` | Cabin Lights Switch | 아직 없음 | - | `/vehicle/body` cabin_light | - |
| `reading-lights-switch` | Reading Lights | 아직 없음 | - | `/vehicle/reading-lights` area=…&value | - |
| `ambient-light-switch` | Ambient Light Switch | 아직 없음 | - | `/vehicle/body` ambient_mode | - |
| `ambient-light-brightness` | Ambient Brightness | 있음: 실내 점광 세기 | car.ambientPct | `/vehicle/body` ambient_brightness | 보냄 |
| `ambient-light-color` | Ambient Color | 있음: 실내 점광 색(밤에 보임) | car.ambientColor | `/vehicle/body` ambient_color | 보냄 |
| `exterior-lights-mode` | Exterior Lights Mode | 있음: 앞 라이트 바 + 빛줄기(밤) | car.headlamp | `/vehicle/lights` feature=headlamp_mode&value | 보냄 |
| `high-beam-lights` | High Beam | 있음: 빛줄기 길이·세기 | car.highBeam | `/vehicle/lights` feature=high_beam&value | 보냄 |
| `hazard-lights` | Hazard Lights | 있음: 네 귀퉁이 점멸, 계기판 | car.hazard | `/vehicle/lights` feature=hazard&value | 보냄 |
| `stop-lights` | Stop Lights | 있음: 브레이크등 3개(`brake` 노드) | car.brake > 0 | `/vehicle/lights` feature=stop_light&value | 보냄 |
| `door-lights` | Door Lights | 아직 없음 | - | `/vehicle/lights` feature=door_light&area=…&value | - |
| `escort-lights` | Escort Lights | 아직 없음 | - | `/vehicle/lights` feature=escort_enabled&value | - |
| `turn-signal-state` | Turn Signal State | 있음: 앞뒤 방향지시등 점멸, 계기판 화살표 | car.signal | `/vehicle/turn-signal` mode | 보냄 |
| `window-position` | Window Position | 있음: 창문 4개 높이(`window_fl` 등) | car.windows[area] | `/vehicle/body` window_fl/window_fr/window_rl/window_rr | 보냄 |
| `window-lock` | Window Lock | 아직 없음 | - | `/vehicle/window-lock` area=…&locked | - |
| `seat-fore-aft-position` | Seat Fore/Aft Position | 아직 없음 | - | `/vehicle/seat` kind=position&control=slide&area=…&value | - |
| `seat-fore-aft-move` | Seat Fore/Aft Move | 아직 없음 | - | `/vehicle/seat` kind=move&control=slide&area=…&value | - |
| `seat-backrest-position` | Seat Backrest Position | 아직 없음 | - | `/vehicle/seat` kind=position&control=recline&area=…&value | - |
| `seat-backrest-move` | Seat Backrest Move | 아직 없음 | - | `/vehicle/seat` kind=move&control=recline&area=…&value | - |
| `seat-height-position` | Seat Height Position | 아직 없음 | - | `/vehicle/seat` kind=position&control=height&area=…&value | - |
| `seat-height-move` | Seat Height Move | 아직 없음 | - | `/vehicle/seat` kind=move&control=height&area=…&value | - |
| `seat-tilt-position` | Seat Tilt Position | 아직 없음 | - | `/vehicle/seat` kind=position&control=tilt&area=…&value | - |
| `seat-tilt-move` | Seat Tilt Move | 아직 없음 | - | `/vehicle/seat` kind=move&control=tilt&area=…&value | - |
| `seat-lumbar-position` | Seat Lumbar Position | 아직 없음 | - | `/vehicle/seat` kind=position&control=lumbar&area=…&value | - |
| `seat-lumbar-move` | Seat Lumbar Move | 아직 없음 | - | `/vehicle/seat` kind=move&control=lumbar&area=…&value | - |
| `seat-occupancy` | Seat Occupancy | 있음: 좌석의 탑승자 인형(`seat_*`) | car.seats[area] | `/vehicle/seat` kind=occupied&area=…&value | 보냄 |
| `windshield-wipers-switch` | Windshield Wiper Switch | 아직 없음 | - | `/vehicle/body` front_wiper/rear_wiper | - |
| `glove-box-door-pos` | Glove Box | 아직 없음 | - | `/vehicle/glove-box` opened | - |
