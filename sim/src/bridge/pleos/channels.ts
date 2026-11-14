// 현대차 공식 Virtual Console(HTTP 8088) 호출부. 경로·필드 이름은 GET /vehicle/catalog 실측(2026-11-14)을 그대로 쓴다.
// 순수 함수만 둔다 (DOM 없음) → src/selftest.ts 에서 검사.
import { AREAS, SEATS, type Car, type Area } from '../../state.ts'

/** PUT 한 번 = 요청 하나. path가 바뀔 때만 보낸다. */
export interface Req { id: string; path: (c: Car) => string }
/** 텔레메트리 한 줄: 넣은 값(상태) · 에뮬레이터가 가진 값(GET /vehicle/state). req = 이 값을 싣는 요청 */
export interface Row { label: string; req: string; input: (c: Car) => string; emu: (vc: any) => string; blink?: boolean }

/** 실측: hazard_on 은 램프 점멸 순간을 그대로 보여 준다(0.5초마다 true/false). 최근 1.5초 안에 true였으면 켜짐으로 본다 */
export const BLINK_HOLD_MS = 1500
export function emuValue(row: Row, vc: any, lastTrue: Record<string, number>, now: number) {
  const v = row.emu(vc)
  if (!row.blink) return v
  if (v === 'true') lastTrue[row.label] = now
  return now - (lastTrue[row.label] ?? -Infinity) < BLINK_HOLD_MS ? 'true' : v
}

const short: Record<Area, string> = { front_left: 'fl', front_right: 'fr', rear_left: 'rl', rear_right: 'rr' }
export const TIRE_AREA_ID: Record<Area, number> = { front_left: 1114113, front_right: 1114191, rear_left: 1179649, rear_right: 1179727 }
const kor: Record<string, string> = { front_left: '앞왼', front_right: '앞오', rear_left: '뒤왼', rear_right: '뒤오', driver: '운전석', passenger: '조수석' }

const q = (o: Record<string, string | number | boolean>) =>
  Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
const s = (v: unknown) => (v === undefined || v === null ? '-' : String(v))

export const REQS: Req[] = [
  { id: 'gear', path: c => `/vehicle/gear?${q({ gear: c.gear })}` },
  // 설계 12절: 차속은 무대가 정하고 speed로 직접 보낸다. 조향은 5도 단위로 묶어 과전송을 막는다
  { id: 'controls', path: c => `/vehicle/controls?${q({ speed: Math.round(c.speedKph), steering: Math.round(c.steeringDeg / 5) * 5, accelerator: 0, brake: Math.round(c.brake) })}` },
  // 실측: 비상등과 방향지시등은 서로를 끈다. 비상등이 켜져 있으면 비상등만, 꺼지면 방향지시 상태를 보낸다
  { id: 'lamp', path: c => (c.hazard ? `/vehicle/lights?${q({ feature: 'hazard', value: true })}` : `/vehicle/turn-signal?${q({ mode: c.signal })}`) },
  { id: 'headlamp', path: c => `/vehicle/lights?${q({ feature: 'headlamp_mode', value: c.headlamp })}` },
  { id: 'highbeam', path: c => `/vehicle/lights?${q({ feature: 'high_beam', value: c.highBeam })}` },
  { id: 'stop', path: c => `/vehicle/lights?${q({ feature: 'stop_light', value: c.brake > 0 })}` },
  {
    id: 'body', path: c => `/vehicle/body?${q({
      ...Object.fromEntries(AREAS.map(a => [`door_${short[a]}`, c.doors[a]])),
      ...Object.fromEntries(AREAS.map(a => [`window_${short[a]}`, Math.round(c.windows[a])])),
      trunk: c.trunk, frunk: c.frunk, doors_locked: c.locked,
      ambient_color: c.ambientColor, ambient_brightness: Math.round(c.ambientPct),
    })}`,
  },
  ...SEATS.map(a => ({ id: `seat_${a}`, path: (c: Car) => `/vehicle/seat?${q({ kind: 'occupied', area: a, value: c.seats[a] })}` })),
  { id: 'ad', path: c => `/vehicle/driving-mode?${q({ ad_mode_state: c.adMode, target_speed_mps: c.targetSpeedMps.toFixed(2) })}` },
  ...AREAS.map(a => ({ id: `tire_${a}`, path: (c: Car) => `/vehicle/tire-pressure?${q({ area: TIRE_AREA_ID[a], pressure_kpa: Math.round(c.tireKpa[a]) })}` })),
  { id: 'abs', path: c => `/vehicle/telltales/simulator?${q({ type: 'ABS', state: c.abs, color: 'Red' })}` },
  { id: 'tpms', path: c => `/vehicle/telltales/simulator?${q({ type: 'TPMS', state: c.tpms, color: 'Yellow' })}` },
]

export const ROWS: Row[] = [
  { label: '기어', req: 'gear', input: c => c.gear, emu: v => s(v?.gear?.actual?.value) },
  { label: '차속 km/h', req: 'controls', input: c => String(Math.round(c.speedKph)), emu: v => s(v?.controls?.speed_kph !== undefined ? Math.round(v.controls.speed_kph) : undefined) },
  { label: '핸들 °', req: 'controls', input: c => String(Math.round(c.steeringDeg / 5) * 5), emu: v => s(v?.controls?.steering_deg !== undefined ? Math.round(v.controls.steering_deg) : undefined) },
  { label: '브레이크 %', req: 'controls', input: c => String(Math.round(c.brake)), emu: v => s(v?.controls?.brake_pct !== undefined ? Math.round(v.controls.brake_pct) : undefined) },
  { label: '방향지시', req: 'lamp', input: c => (c.hazard ? 'Off' : c.signal), emu: v => s(v?.lights?.turn_signal_mode) },
  { label: '비상등', req: 'lamp', input: c => String(c.hazard), emu: v => s(v?.lights?.hazard_on), blink: true },
  { label: '전조등', req: 'headlamp', input: c => c.headlamp, emu: v => s(v?.lights?.headlamp_mode) },
  { label: '상향등', req: 'highbeam', input: c => String(c.highBeam), emu: v => s(v?.lights?.high_beam_on) },
  { label: '브레이크등', req: 'stop', input: c => String(c.brake > 0), emu: v => s(v?.lights?.stop_light_on) },
  ...AREAS.map(a => ({ label: `문 ${kor[a]}`, req: 'body', input: (c: Car) => String(c.doors[a]), emu: (v: any) => s(v?.body?.doors?.[a]) })),
  ...AREAS.map(a => ({ label: `창문 ${kor[a]} %`, req: 'body', input: (c: Car) => String(Math.round(c.windows[a])), emu: (v: any) => s(v?.body?.windows?.[a]) })),
  { label: '트렁크', req: 'body', input: c => String(c.trunk), emu: v => s(v?.body?.closures?.trunk) },
  { label: '프렁크', req: 'body', input: c => String(c.frunk), emu: v => s(v?.body?.closures?.frunk) },
  { label: '도어 잠금', req: 'body', input: c => String(c.locked), emu: v => s(v?.body?.door_locks?.all) },
  { label: '무드등 색', req: 'body', input: c => c.ambientColor, emu: v => s(v?.body?.ambient_light?.color) },
  ...SEATS.map(a => ({ label: `착좌 ${kor[a]}`, req: `seat_${a}`, input: (c: Car) => String(c.seats[a]), emu: (v: any) => s(v?.seat?.occupied?.[a]) })),
  { label: '자율 모드', req: 'ad', input: c => c.adMode, emu: v => s(v?.driving_mode?.ad_mode_state) },
  { label: '목표 속도 m/s', req: 'ad', input: c => c.targetSpeedMps.toFixed(1), emu: v => s(v?.driving_mode?.target_speed_mps !== undefined ? Number(v.driving_mode.target_speed_mps).toFixed(1) : undefined) },
  ...AREAS.map(a => ({ label: `공기압 ${kor[a]} kPa`, req: `tire_${a}`, input: (c: Car) => String(Math.round(c.tireKpa[a])), emu: (v: any) => s(v?.tire_pressure?.pressure_kpa?.[TIRE_AREA_ID[a]] !== undefined ? Math.round(v.tire_pressure.pressure_kpa[TIRE_AREA_ID[a]]) : undefined) })),
  { label: 'ABS 경고등', req: 'abs', input: c => c.abs, emu: v => s(v?.telltales?.actual?.ABS?.state ?? 'Off') },
  { label: 'TPMS 경고등', req: 'tpms', input: c => c.tpms, emu: v => s(v?.telltales?.actual?.TPMS?.state ?? 'Off') },
]

/** 마지막으로 보낸 경로와 다른 요청만 고른다 */
export const changed = (c: Car, sent: Record<string, string>) =>
  REQS.map(r => ({ id: r.id, path: r.path(c) })).filter(r => sent[r.id] !== r.path)
