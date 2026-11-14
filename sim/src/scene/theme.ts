// 테마 객체 하나 + 치수 상수 한 곳 (아트 디렉션 30_design/3d/art-direction.md 1·3·8절).
// 1 단위 = 1m. 보라(accent)는 무대 사물에 쓰지 않는다: "앱이 판단한 순간"의 빛에만.
import type { TimeOfDay } from '../state.ts'

export const DIM = {
  car: { len: 4.6, width: 1.9, height: 1.6, wheelbase: 3.0, wheelR: 0.375 },
  eye: { driver: 1.25, driverLeft: 0.37, pedestrian: 1.6 },
  bus: { len: 6.2, width: 2.0, height: 2.6 },
  person: { adult: 1.7, student: 1.6, child: 1.3 },
  floor: { ground: 4.0, upper: 3.0 },
  lane: 3.0, sidewalk: 3.5,
  crosswalk: { x0: 20, x1: 24, bar: 0.5, gap: 0.5 },
  stopLine: { west: 26, east: 18, width: 0.4 }, // 서행 차로는 +x에서 다가와 x=26에 선다
  bollard: { h: 0.9, d: 0.15, gap: 1.5 },
  tree: { h: 6, gap: 8 }, pole: { h: 10, d: 0.35 }, signalPole: 5.5,
  banner: { w: 5, h: 0.9, y: 2.5 },
  academyDoorX: -4, busStopX: -30, academyBusX: -13,
}
export const HALF_X = 50 // 무대 길이 100m (차는 끝에서 반대편으로 돌아온다)
export const ROAD_HALF = DIM.lane * 2 // 왕복 4차로 = 12m
// 좌표: x = 동(+)서(-), z = 남(+)북(-). 우측통행: 서행(-x) 차로가 북쪽.
export const LANES = { west: [-DIM.lane / 2, -DIM.lane * 1.5], east: [DIM.lane / 2, DIM.lane * 1.5] } // [중앙선 쪽, 갓길 쪽]

export interface Theme {
  skyTop: string; skyBottom: string
  asphalt: string; sidewalk: string; curb: string; lineWhite: string; lineYellow: string
  wallA: string; wallB: string; glass: string; glassGlow: number
  signBlue: string; signRed: string; signGreen: string; store: string; signGlow: number
  leaf: string; car: string; bus: string; streetLight: string | null
  outline: string; accent: string
  sun: number; sunColor: string; sunElev: number; hemi: number; env: number
  hdri: string
}

export const THEME: Record<TimeOfDay, Theme> = {
  day: {
    skyTop: '#BFD9EC', skyBottom: '#E8F1F6', asphalt: '#5E626B', sidewalk: '#D9D3C7', curb: '#B9B4AA', lineWhite: '#F4F4F0', lineYellow: '#E8B53A',
    wallA: '#EDE6DA', wallB: '#C9A58C', glass: '#9FB8C8', glassGlow: 0, signBlue: '#3A63A8', signRed: '#C9483F', signGreen: '#3E8C5E', store: '#F6F8F8', signGlow: 0,
    leaf: '#6E9E5A', car: '#E6E8EA', bus: '#F2C230', streetLight: null, outline: '#1F1F29', accent: '#6D4AFF',
    sun: 2.6, sunColor: '#FFF6E8', sunElev: 50, hemi: 1.2, env: 0.6, hdri: 'kloppenheim_06_puresky',
  },
  dusk: {
    skyTop: '#7E74B0', skyBottom: '#F4B98A', asphalt: '#4A4652', sidewalk: '#B7A697', curb: '#968A80', lineWhite: '#E9D9C8', lineYellow: '#D99A3A',
    wallA: '#D8B99E', wallB: '#A87E68', glass: '#F2B880', glassGlow: 0.35, signBlue: '#3A5C98', signRed: '#B9473F', signGreen: '#3B7D57', store: '#FFF3E0', signGlow: 0.35,
    leaf: '#7C8A4E', car: '#D9CFC8', bus: '#E8A93A', streetLight: '#FFE2B0', outline: '#1F1F29', accent: '#6D4AFF',
    sun: 1.8, sunColor: '#FF9E5E', sunElev: 8, hemi: 0.9, env: 0.45, hdri: 'qwantani_dusk_2_puresky',
  },
  night: {
    skyTop: '#0E1426', skyBottom: '#24304D', asphalt: '#22242C', sidewalk: '#383944', curb: '#4A4B55', lineWhite: '#AEB3BE', lineYellow: '#8E7533',
    wallA: '#3B3F4D', wallB: '#33343F', glass: '#FFD58A', glassGlow: 1, signBlue: '#6FB8FF', signRed: '#FF7A6B', signGreen: '#8BE08A', store: '#E6F6FF', signGlow: 1,
    leaf: '#25382B', car: '#9AA0AA', bus: '#A88A2E', streetLight: '#F5EEDC', outline: '#05070A', accent: '#8F73FF',
    sun: 0, sunColor: '#9FB4FF', sunElev: 40, hemi: 0.35, env: 0.25, hdri: 'moonless_golf',
  },
}

/** 카메라 프리셋 (아트 디렉션 8절) */
export const CAM = {
  iso: { azimuthDeg: 45, elevDeg: 30, width: 40, widthOut: 110, turnSec: 0.6 },
  chase: { fov: 40, back: 9, up: 3.5, lookAhead: 5 },
  driver: { fov: 55, pitchDeg: -5, near: 0.05 },
  pedestrian: { fov: 50, eye: DIM.eye.pedestrian },
}
