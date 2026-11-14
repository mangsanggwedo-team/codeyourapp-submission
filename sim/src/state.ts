// 상태 저장소 하나가 진실이다 (설계 5절). 무대·계기판·연결기·다른 창이 모두 여기를 읽는다.
// 이름은 Virtual Console 카탈로그 값에 맞춘다 (docs/vehicle-data-map.md).

export type Gear = 'Park' | 'Reverse' | 'Neutral' | 'Drive'
export type Signal = 'Off' | 'BlinkLeft' | 'BlinkRight'
export type Headlamp = 'Off' | 'Auto' | 'Position' | 'LowBeam'
export type AdMode = 'not_ready' | 'ready' | 'longitudinal' | 'lateral' | 'full_autonomous'
export type Telltale = 'Off' | 'On' | 'Blink'
export type TimeOfDay = 'day' | 'dusk' | 'night'
export type Area = 'front_left' | 'front_right' | 'rear_left' | 'rear_right'
export type SeatArea = 'driver' | 'passenger' | 'rear_left' | 'rear_right'
export const AREAS: Area[] = ['front_left', 'front_right', 'rear_left', 'rear_right']
export const SEATS: SeatArea[] = ['driver', 'passenger', 'rear_left', 'rear_right']

export interface Car {
  gear: Gear
  speedKph: number
  steeringDeg: number // 핸들 각도 (-470~500, 왼쪽이 음수)
  accelerator: number // 0~100
  brake: number // 0~100
  signal: Signal
  hazard: boolean
  headlamp: Headlamp
  highBeam: boolean
  doors: Record<Area, boolean>
  windows: Record<Area, number> // 0 닫힘 ~ 100 완전 열림
  trunk: boolean
  frunk: boolean
  locked: boolean
  seats: Record<SeatArea, boolean>
  adMode: AdMode
  targetSpeedMps: number
  tireKpa: Record<Area, number>
  abs: Telltale
  tpms: Telltale
  ambientColor: string
  ambientPct: number
}

export interface SimState {
  car: Car
  pose: { x: number; z: number; yaw: number } // 무대 좌표 (m, rad). 무대만 쓰고 보내지 않는다
  goal: { x: number; z: number } | null // 자율주행 목표 지점
  time: TimeOfDay
  mode: 'sim' | 'drive'
  appGlow: boolean // 앱이 판단한 순간의 빛 자리 (아이디어 확정 후 앱 결과로 켠다)
}

const four = <K extends string, V>(keys: K[], v: V) => Object.fromEntries(keys.map(k => [k, v])) as Record<K, V>

export const initialState = (): SimState => ({
  car: {
    gear: 'Park', speedKph: 0, steeringDeg: 0, accelerator: 0, brake: 0,
    signal: 'Off', hazard: false, headlamp: 'Auto', highBeam: false,
    doors: four(AREAS, false), windows: four(AREAS, 0), trunk: false, frunk: false, locked: true,
    seats: { driver: true, passenger: false, rear_left: false, rear_right: false },
    adMode: 'not_ready', targetSpeedMps: 8.333,
    tireKpa: four(AREAS, 250), abs: 'Off', tpms: 'Off',
    ambientColor: '#ffffff', ambientPct: 30,
  },
  pose: { x: 0, z: -4.5, yaw: Math.PI }, // 원점, 북쪽 갓길 차로, 서쪽을 봄 (아트 디렉션 11절)
  goal: null,
  time: 'dusk',
  mode: 'sim',
  appGlow: false,
})

export type Patch = { car?: Partial<Car> } & Partial<Omit<SimState, 'car'>>
type Listener = (s: SimState, prev: SimState) => void

let state = initialState()
const listeners = new Set<Listener>()

export const getState = () => state
export function setState(patch: Patch) {
  const prev = state
  state = { ...prev, ...patch, car: patch.car ? { ...prev.car, ...patch.car } : prev.car }
  listeners.forEach(l => l(state, prev))
}
export function replaceState(next: SimState) {
  const prev = state
  state = next
  listeners.forEach(l => l(state, prev))
}
export function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}
