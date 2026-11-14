// 운전 주체: 사람(키보드) · 자율(차선 따라가기, 깜빡이 차로 변경, 신호 정지, 목표 지점). 메인 창에서만 돈다.
// 차 움직임은 운동학 자전거 모델. 판단 규칙(앱 :core)은 여기서 다시 짜지 않는다. 여기는 "차가 어떻게 움직이나"만.
import { getState, setState, type Car } from './state.ts'
import { WHEELBASE } from './scene/car.ts'
import { carLight, HALF_X, LANES, OBSTACLES, ROAD_HALF, STOP_LINE } from './scene/stage.ts'

const keys = new Set<string>()
/** 키 누름. 새 창에서 누른 키도 BroadcastChannel로 여기로 온다 */
export function pressKey(key: string) {
  if (keys.has(key)) return
  keys.add(key)
  const c = getState().car
  const k = key.toLowerCase()
  if (k === 'q') setState({ car: { signal: c.signal === 'BlinkLeft' ? 'Off' : 'BlinkLeft' } })
  if (k === 'e') setState({ car: { signal: c.signal === 'BlinkRight' ? 'Off' : 'BlinkRight' } })
  if (k === 'h') setState({ car: { hazard: !c.hazard } })
  const gear = ({ p: 'Park', r: 'Reverse', n: 'Neutral', d: 'Drive' } as const)[k as 'p']
  if (gear && c.speedKph < 3) setState({ car: { gear } })
}
export const releaseKey = (key: string) => keys.delete(key)
export const releaseAll = () => keys.clear()
export const DRIVE_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']

const wrap = (x: number) => (x > HALF_X ? x - 2 * HALF_X : x < -HALF_X ? x + 2 * HALF_X : x)
const approach = (v: number, target: number, rate: number) => (v < target ? Math.min(target, v + rate) : Math.max(target, v - rate))

/** 자율: 목표 차로 z, 목표 속도(m/s), 방향지시 해제 여부 */
export function autopilot(c: Car, pose: { x: number; z: number; yaw: number }, goal: { x: number; z: number } | null, t: number) {
  const dirE = Math.cos(pose.yaw) >= 0
  const lanes = dirE ? LANES.east : LANES.west
  // 현재 차로 = 가장 가까운 차로. 깜빡이가 켜져 있으면 그쪽 차로로
  let laneIdx = lanes.reduce((b, z, i) => (Math.abs(z - pose.z) < Math.abs(lanes[b] - pose.z) ? i : b), 0)
  if (goal) laneIdx = lanes.reduce((b, z, i) => (Math.abs(z - goal.z) < Math.abs(lanes[b] - goal.z) ? i : b), 0)
  // 깜빡이가 목표 차로보다 우선. 진행 방향 왼쪽 = 중앙선 쪽(인덱스 0), 오른쪽 = 갓길 쪽
  if (c.signal === 'BlinkLeft') laneIdx = 0
  if (c.signal === 'BlinkRight') laneIdx = lanes.length - 1
  const laneZ = lanes[laneIdx]
  const fwd = dirE ? 1 : -1
  // 앞 거리: 정지선, 목표 지점
  let vMax = c.targetSpeedMps
  const stopX = dirE ? STOP_LINE.east : STOP_LINE.west
  const toStop = (stopX - pose.x) * fwd - 2.3 // 앞범퍼 기준
  if (carLight(t) !== 'green' && toStop > -0.5 && toStop < 40) vMax = Math.min(vMax, Math.sqrt(Math.max(0, 2 * 2.5 * toStop)))
  for (const o of OBSTACLES) { // 같은 차로 앞에 서 있는 차 (학원 버스 등) 뒤에 선다
    if (Math.abs(o.z - laneZ) > 1.6) continue
    let d = (o.x - pose.x) * fwd
    if (d < -5) d += 2 * HALF_X
    const gap = d - o.len / 2 - 2.3 - 2.5
    if (d > 0 && d < 45) vMax = Math.min(vMax, Math.sqrt(Math.max(0, 2 * 2.5 * gap)))
  }
  if (goal) {
    let d = (goal.x - pose.x) * fwd
    if (d < -1) d += 2 * HALF_X
    vMax = Math.min(vMax, Math.sqrt(Math.max(0, 2 * 2 * (d - 0.3))))
  }
  // 차로 따라가기 (Stanley): 헤딩 오차 + 횡 오차
  const v = c.speedKph / 3.6
  const e = (laneZ - pose.z) * fwd // 진행 방향 기준 오른쪽(+)
  const headErr = (dirE ? 0 : Math.PI) - pose.yaw
  const h = Math.atan2(Math.sin(headErr), Math.cos(headErr))
  const delta = -h + Math.atan2(0.6 * e, v + 2) // 오른쪽 조향(+) 이 +z로
  const steeringDeg = Math.max(-470, Math.min(500, delta * 180 / Math.PI * 14))
  const done = Math.abs(pose.z - laneZ) < 0.25 && Math.abs(h) < 0.05
  const arrived = !!goal && vMax < 0.3 && v < 0.3
  return { vMax, steeringDeg, cancelSignal: c.signal !== 'Off' && done, arrived, laneZ }
}

export function step(dt: number, t: number) {
  const s = getState()
  const c = s.car
  let { x, z, yaw } = s.pose
  let v = (c.gear === 'Reverse' ? -1 : 1) * c.speedKph / 3.6
  let steeringDeg = c.steeringDeg, accelerator = 0, brake = 0
  const patch: Partial<Car> = {}
  const auto = c.adMode === 'full_autonomous' && c.gear === 'Drive'

  if (auto) {
    const ap = autopilot(c, s.pose, s.goal, t)
    steeringDeg = approach(steeringDeg, ap.steeringDeg, 600 * dt)
    if (v < ap.vMax - 0.2) { v = Math.min(ap.vMax, v + 2.0 * dt); accelerator = 30 }
    else if (v > ap.vMax + 0.2) { v = Math.max(ap.vMax, v - 3.0 * dt); brake = Math.min(100, 20 + (v - ap.vMax) * 20) }
    else if (ap.vMax < 0.3) brake = 30 // 정지 유지
    if (ap.cancelSignal) patch.signal = 'Off'
    // 깜빡이 차로 변경이 끝나면 목표 지점도 그 차로로 옮긴다 (안 옮기면 원래 차로로 되돌아감)
    if (ap.cancelSignal && s.goal) setState({ goal: { ...s.goal, z: ap.laneZ } })
    if (keys.has(' ') || keys.has('ArrowDown')) patch.adMode = 'not_ready' // 사람이 브레이크를 밟으면 자율 해제
    if (ap.arrived) setTimeout(() => setState({ goal: null }), 0)
  } else if (s.mode === 'drive') {
    const up = keys.has('ArrowUp'), down = keys.has('ArrowDown'), space = keys.has(' ')
    const sign = c.gear === 'Reverse' ? -1 : 1
    if (c.gear === 'Park') v = 0
    else if (up && (c.gear === 'Drive' || c.gear === 'Reverse')) { accelerator = 60; v += sign * 3.0 * dt }
    if (down || space) { brake = space ? 100 : 50; v = approach(v, 0, (space ? 9 : 5) * dt) }
    else if (!up) v = approach(v, 0, 0.4 * dt) // 굴러가다 서서히
    v = sign > 0 ? Math.max(0, Math.min(v, 33)) : Math.min(0, Math.max(v, -5))
    const target = keys.has('ArrowLeft') ? -470 : keys.has('ArrowRight') ? 470 : 0
    steeringDeg = approach(steeringDeg, target, (target === 0 ? 700 : 400) * dt)
  } else {
    // 심 방식: 수동 조작 없이 서서히 선다
    v = approach(v, 0, 3 * dt)
    if (Math.abs(v) > 0.05) brake = 30
  }
  if (c.gear === 'Park') v = 0

  const delta = (-steeringDeg / 14) * Math.PI / 180
  yaw += (v * Math.tan(delta) / WHEELBASE) * dt
  x = wrap(x + Math.cos(yaw) * v * dt)
  z -= Math.sin(yaw) * v * dt
  z = Math.max(-ROAD_HALF + 0.9, Math.min(ROAD_HALF - 0.9, z)) // 연석을 넘지 않는다 (shortcut: 충돌 처리 대신 도로 폭으로 묶음)

  setState({
    pose: { x, z, yaw },
    car: { ...patch, speedKph: Math.abs(v) * 3.6, steeringDeg, accelerator, brake: c.gear === 'Park' ? 0 : brake },
  })
}
