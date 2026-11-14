// 주인공 차: 코드로 만든 일반형 EV (특정 차종 형상·로고 없음). 부품이 상태 값을 그대로 따른다.
// 차 로컬 좌표: 앞 +x, 오른쪽 +z, 위 +y. 운전석은 왼쪽(-z).
import * as THREE from 'three'
import { DIM } from './theme.ts'
import { AREAS, SEATS, type Area, type Car, type SeatArea } from '../state.ts'

const std = (color: number | string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, flatShading: true, ...extra })
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true
  return m
}

export const WHEELBASE = DIM.car.wheelbase
const WHEEL_R = DIM.car.wheelR
const DOOR: Record<Area, { hinge: number; len: number; side: 1 | -1 }> = {
  front_left: { hinge: 1.0, len: 1.05, side: -1 }, front_right: { hinge: 1.0, len: 1.05, side: 1 },
  rear_left: { hinge: -0.05, len: 1.0, side: -1 }, rear_right: { hinge: -0.05, len: 1.0, side: 1 },
}
const SEAT_POS: Record<SeatArea, [number, number]> = { driver: [-0.15, -DIM.eye.driverLeft], passenger: [-0.15, DIM.eye.driverLeft], rear_left: [-1.15, -0.42], rear_right: [-1.15, 0.42] }
// 노드 이름 = Virtual Console 키 (아트 디렉션 11절): door_fl, window_fl, trunk, wheel_fl, seat_driver ...
const SHORT: Record<Area, string> = { front_left: 'fl', front_right: 'fr', rear_left: 'rl', rear_right: 'rr' }
const PEOPLE = ['#3A63A8', '#C9483F', '#3E8C5E', '#E8B53A']

export function buildCar() {
  const root = new THREE.Group()
  const paint = std(0xe6e8ea)
  const dark = std(0x2b2f36)
  const glass = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.55 })

  // 차체 아래(문 자리는 비워 두지 않고 안쪽 판으로 둔다 → 문을 열면 실내가 보인다)
  root.add(box(DIM.car.len - 0.04, 0.42, 1.86, paint, 0, 0.5, 0)) // 문턱 높이까지
  root.add(box(1.32, 0.5, 1.86, paint, 1.64, 0.95, 0)) // 앞 펜더
  root.add(box(0.8, 0.5, 1.86, paint, -1.9, 0.95, 0)) // 뒤 펜더
  root.add(box(0.06, 0.5, 1.7, dark, -0.05, 0.95, 0)) // B필러 하단
  root.add(box(DIM.car.len, 0.12, DIM.car.width - 0.02, dark, 0, 0.3, 0)) // 하부 클래딩
  // 지붕과 필러
  root.add(box(2.4, 0.08, 1.62, paint, -0.45, 1.52, 0))
  for (const z of [-0.78, 0.78]) {
    root.add(box(0.08, 0.55, 0.06, dark, -0.05, 1.23, z)) // B필러
    const a = box(0.75, 0.06, 0.06, dark, 1.12, 1.24, z); a.rotation.z = -0.62; root.add(a) // A필러
    root.add(box(0.06, 0.55, 0.06, dark, -1.62, 1.23, z)) // C필러
  }
  const ws = box(0.9, 0.04, 1.5, glass, 1.12, 1.24, 0); ws.rotation.z = -0.62; root.add(ws) // 앞유리
  // 실내
  root.add(box(0.35, 0.28, 1.6, dark, 0.75, 0.92, 0)) // 대시보드
  const screen = box(0.03, 0.12, 0.5, std(0x111111, { emissive: 0x2a6fdb, emissiveIntensity: 0.35 }), 0.62, 1.1, 0.05)
  screen.name = 'cluster'
  root.add(screen) // 계기판·중앙 디스플레이 자리 (Pleos 화면)
  // 앱이 판단한 순간의 빛: 차 주변 바닥 고리 반경 2.5m, 강조 보라 (무대 사물에는 보라를 쓰지 않는다)
  const ringMat = new THREE.MeshBasicMaterial({ color: '#6D4AFF', transparent: true, opacity: 0.85 })
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.6, 48), ringMat)
  ring.name = 'app_ring'; ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; ring.visible = false
  root.add(ring)

  // 문 4개 (경첩 피벗) + 창문 4개 (문 안에서 내려감)
  const doors = {} as Record<Area, THREE.Group>
  const windows = {} as Record<Area, THREE.Mesh>
  for (const a of AREAS) {
    const d = DOOR[a]
    const pivot = new THREE.Group()
    pivot.name = `door_${SHORT[a]}`
    pivot.position.set(d.hinge, 0, d.side * 0.95)
    pivot.add(box(d.len, 0.5, 0.07, paint, -d.len / 2, 0.95, 0)) // 문 판
    pivot.add(box(d.len, 0.04, 0.08, dark, -d.len / 2, 1.21, 0)) // 벨트라인
    pivot.add(box(0.14, 0.03, 0.03, dark, -d.len * 0.8, 1.05, d.side * 0.05)) // 손잡이
    const w = box(d.len - 0.1, 0.42, 0.03, glass, -d.len / 2, 1.43, 0)
    w.name = `window_${SHORT[a]}`
    pivot.add(w)
    if (a.startsWith('front')) pivot.add(box(0.18, 0.12, 0.2, dark, -0.1, 1.25, d.side * 0.12)) // 사이드미러
    root.add(pivot)
    doors[a] = pivot; windows[a] = w
  }

  // 프렁크(보닛)와 트렁크(해치)
  const frunk = new THREE.Group(); frunk.name = 'frunk'; frunk.position.set(0.95, 1.2, 0)
  frunk.add(box(1.32, 0.05, 1.8, paint, 0.66, 0, 0)); root.add(frunk)
  const trunk = new THREE.Group(); trunk.name = 'trunk'; trunk.position.set(-1.65, 1.52, 0)
  const hatch = box(0.75, 0.05, 1.6, glass, -0.33, -0.25, 0); hatch.rotation.z = 0.72
  trunk.add(hatch, box(0.06, 0.45, 1.84, paint, -0.62, -0.62, 0)); root.add(trunk)

  // 등화
  const head = std(0xffffff, { emissive: 0xfff6e0, emissiveIntensity: 0.2 })
  const tail = std(0x7a1010, { emissive: 0xff2020, emissiveIntensity: 0.3 })
  const amber = () => std(0x6a4a10, { emissive: 0xffa000, emissiveIntensity: 0 })
  root.add(box(0.05, 0.08, 1.5, head, 2.3, 0.98, 0)) // 앞 라이트 바
  root.add(box(0.05, 0.08, 1.7, tail, -2.3, 1.0, 0)) // 뒤 라이트 바
  const stopMat = std(0x7a1010, { emissive: 0xff1010, emissiveIntensity: 0 })
  const brakeG = new THREE.Group(); brakeG.name = 'brake'
  brakeG.add(box(0.05, 0.05, 0.5, stopMat, -1.66, 1.5, 0)) // 보조 제동등
  for (const z of [-0.6, 0.6]) brakeG.add(box(0.06, 0.16, 0.3, stopMat, -2.31, 0.82, z))
  root.add(brakeG)
  const ind = { fl: amber(), fr: amber(), rl: amber(), rr: amber() }
  const turnL = new THREE.Group(); turnL.name = 'turn_l'
  const turnR = new THREE.Group(); turnR.name = 'turn_r'
  turnL.add(box(0.06, 0.08, 0.2, ind.fl, 2.31, 0.86, -0.8), box(0.06, 0.08, 0.2, ind.rl, -2.31, 0.86, -0.85))
  turnR.add(box(0.06, 0.08, 0.2, ind.fr, 2.31, 0.86, 0.8), box(0.06, 0.08, 0.2, ind.rr, -2.31, 0.86, 0.85))
  root.add(turnL, turnR)
  const beams = [-0.55, 0.55].map(z => {
    const s = new THREE.SpotLight(0xfff6e0, 0, 40, 0.45, 0.5, 1.2)
    s.position.set(2.2, 0.95, z); s.target.position.set(12, 0, z)
    root.add(s, s.target)
    return s
  })

  // 바퀴: 조향 그룹 → 회전 그룹 → 타이어
  const wheels = {} as Record<Area, { steer: THREE.Group; spin: THREE.Group; tire: THREE.Mesh }>
  for (const a of AREAS) {
    const steer = new THREE.Group()
    steer.name = `wheel_${SHORT[a]}`
    steer.position.set(a.startsWith('front') ? WHEELBASE / 2 : -WHEELBASE / 2, WHEEL_R, a.endsWith('left') ? -0.83 : 0.83)
    const spin = new THREE.Group()
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.26, 18), std(0x1d1f22))
    tire.rotation.x = Math.PI / 2; tire.castShadow = true
    spin.add(tire)
    for (let i = 0; i < 3; i++) { // 휠 스포크 (회전이 보이게)
      const sp = box(0.5, 0.06, 0.02, std(0xc9ced6), 0, 0, a.endsWith('left') ? -0.14 : 0.14); sp.rotation.z = i * Math.PI / 3; spin.add(sp)
    }
    steer.add(spin); root.add(steer)
    wheels[a] = { steer, spin, tire }
  }

  // 좌석·핸들·탑승자
  const seatMat = std(0x3a3f4a)
  const occupants = {} as Record<SeatArea, THREE.Group>
  for (const s of SEATS) {
    const [x, z] = SEAT_POS[s]
    root.add(box(0.5, 0.12, 0.48, seatMat, x, 0.78, z), box(0.12, 0.62, 0.48, seatMat, x - 0.27, 1.1, z))
    const o = new THREE.Group()
    o.name = `seat_${s}`
    o.add(box(0.26, 0.48, 0.38, std(PEOPLE[SEATS.indexOf(s)]), x - 0.12, 1.08, z))
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), std(0xf1c8a5)); h.position.set(x - 0.1, 1.44, z)
    o.add(h); root.add(o); occupants[s] = o
  }
  const wheel = new THREE.Group(); wheel.name = 'steering'; wheel.position.set(0.42, 1.08, -DIM.eye.driverLeft); wheel.rotation.z = 0.35
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 24), dark); rim.rotation.y = Math.PI / 2
  const spinWheel = new THREE.Group(); spinWheel.add(rim, box(0.03, 0.03, 0.3, dark))
  const hands = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0xf1c8a5)); m.position.set(0, 0.06, s * 0.17); return m })
  spinWheel.add(...hands) // 운전자의 손 (핸들과 같이 돈다)
  wheel.add(spinWheel); root.add(wheel)
  const cabin = new THREE.PointLight(0xffffff, 0, 3, 1.5); cabin.position.set(-0.4, 1.3, 0); root.add(cabin)

  root.traverse(o => { (o as THREE.Mesh).castShadow = true })

  let spinAngle = 0
  /** 상태 → 3D. night = 0~1 (전조등 빛줄기·무드등을 밤에만 세게) */
  function apply(c: Car, dt: number, t: number, night: number, view: 'outside' | 'driver', theme: { car: string; accent: string }, appGlow: boolean) {
    paint.color.set(theme.car)
    ringMat.color.set(theme.accent); ring.visible = appGlow
    ring.scale.setScalar(1 + Math.sin(t * 3) * 0.03)
    for (const a of AREAS) {
      const d = DOOR[a]
      doors[a].rotation.y = THREE.MathUtils.lerp(doors[a].rotation.y, c.doors[a] ? d.side * 1.1 : 0, Math.min(1, dt * 5))
      windows[a].position.y = THREE.MathUtils.lerp(windows[a].position.y, 1.43 - c.windows[a] / 100 * 0.42, Math.min(1, dt * 6))
    }
    frunk.rotation.z = THREE.MathUtils.lerp(frunk.rotation.z, c.frunk ? 0.9 : 0, Math.min(1, dt * 4))
    trunk.rotation.z = THREE.MathUtils.lerp(trunk.rotation.z, c.trunk ? -1.15 : 0, Math.min(1, dt * 4))
    const roadAngle = THREE.MathUtils.degToRad(-c.steeringDeg / 14) // 핸들 14:1, 오른쪽(+) 조향 = 시계 방향
    wheels.front_left.steer.rotation.y = wheels.front_right.steer.rotation.y = roadAngle
    const dir = c.gear === 'Reverse' ? -1 : 1
    spinAngle -= dir * (c.speedKph / 3.6) * dt / WHEEL_R
    for (const a of AREAS) {
      wheels[a].spin.rotation.z = spinAngle
      wheels[a].tire.scale.set(1, 1, c.tireKpa[a] < 150 ? 0.82 : 1) // 공기압이 아주 낮으면 찌그러져 보인다
      wheels[a].steer.position.y = c.tireKpa[a] < 150 ? WHEEL_R * 0.86 : WHEEL_R
    }
    spinWheel.rotation.x = THREE.MathUtils.degToRad(c.steeringDeg)
    const blink = Math.floor(t * 3) % 2 === 0 // 1.5Hz
    const L = (c.hazard || c.signal === 'BlinkLeft') && blink, R = (c.hazard || c.signal === 'BlinkRight') && blink
    ind.fl.emissiveIntensity = ind.rl.emissiveIntensity = L ? 3 : 0
    ind.fr.emissiveIntensity = ind.rr.emissiveIntensity = R ? 3 : 0
    stopMat.emissiveIntensity = c.brake > 0 ? 3 : 0
    const headOn = c.headlamp === 'LowBeam' || (c.headlamp === 'Auto' && night > 0.3)
    const posOn = headOn || c.headlamp === 'Position'
    head.emissiveIntensity = headOn ? 3 : posOn ? 1 : 0.15
    tail.emissiveIntensity = posOn ? 1.2 : 0.3
    beams.forEach(b => { b.intensity = headOn ? (c.highBeam ? 260 : 120) * Math.max(0.15, night) : 0; b.distance = c.highBeam ? 70 : 40 })
    for (const s of SEATS) occupants[s].visible = c.seats[s]
    occupants.driver.visible = c.seats.driver && view !== 'driver'
    cabin.color.set(appGlow ? theme.accent : c.ambientColor); cabin.intensity = c.ambientPct / 100 * 2 * Math.max(0.2, night)
  }

  return { root, apply }
}
