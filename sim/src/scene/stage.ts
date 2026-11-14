// 무대: 한국 학원가 앞, 주인공 차 = 원점, 반경 약 50m 디오라마. 전부 코드로 만든다(외부 모델 없음).
// 배치는 아트 디렉션 무드보드 평면도: 도로 = x축, 북쪽(-z) 2차로가 서행, 횡단보도 x=20~24.
import * as THREE from 'three'
import { DIM, HALF_X, LANES, ROAD_HALF, THEME, type Theme } from './theme.ts'
import type { TimeOfDay } from '../state.ts'

export { HALF_X, LANES, ROAD_HALF }
export const CROSS_X = (DIM.crosswalk.x0 + DIM.crosswalk.x1) / 2
export const STOP_LINE = DIM.stopLine
const SW0 = ROAD_HALF, SW1 = ROAD_HALF + DIM.sidewalk // 보도 |z| 범위

export type Light = 'green' | 'yellow' | 'red'
const CYCLE = 24
/** 차량 신호. 0~12 초록, 12~15 노랑, 15~24 빨강 (보행 신호는 빨강 구간 안에서 초록) */
export function carLight(t: number): Light {
  const p = t % CYCLE
  return p < 12 ? 'green' : p < 15 ? 'yellow' : 'red'
}
const pedGreen = (t: number) => { const p = t % CYCLE; return p > 15.5 && p < 23.5 }

/** 자율주행이 피해야 할 서 있는 차 (x, z, 길이) */
export const OBSTACLES: { x: number; z: number; len: number }[] = []

// ---- 테마 역할별 재질: 시간대가 바뀌면 색만 바꾼다 ----
type Role = 'asphalt' | 'sidewalk' | 'curb' | 'lineWhite' | 'lineYellow' | 'wallA' | 'wallB' | 'leaf' | 'bus' | 'store'
const roleMats = new Map<Role, THREE.MeshStandardMaterial>()
const role = (r: Role) => {
  if (!roleMats.has(r)) roleMats.set(r, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }))
  return roleMats.get(r)!
}
const fixed = (color: number | string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra })

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true
  return m
}

// ---- 간판: 캔버스 글자. 시간대마다 바탕색을 다시 그린다 ----
type SignColor = 'signBlue' | 'signRed' | 'signGreen' | 'store' | 'white' | 'bus'
const signs: { draw: (th: Theme) => void; mat: THREE.MeshStandardMaterial }[] = []
function sign(text: string, bgKey: SignColor, fg: string, w: number, h: number, vertical = false) {
  const c = document.createElement('canvas')
  const px = 96
  c.width = Math.round((vertical ? h : w) * px); c.height = Math.round((vertical ? w : h) * px)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 })
  const draw = (th: Theme) => {
    const g = c.getContext('2d')!
    g.fillStyle = bgKey === 'white' ? '#F4F4F0' : bgKey === 'bus' ? th.bus : th[bgKey]
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = fg
    g.font = `700 ${Math.round(c.height * (vertical ? 0.12 : 0.6))}px Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    if (vertical) [...text].forEach((ch, i, a) => g.fillText(ch, c.width / 2, c.height * (i + 0.5) / a.length))
    else g.fillText(text, c.width / 2, c.height * 0.54, c.width * 0.92)
    tex.needsUpdate = true
  }
  signs.push({ draw, mat })
  return box(vertical ? 0.15 : w, vertical ? w : h, vertical ? h : 0.12, mat)
}


/** 근린상가: 1층 4m + 위층 3m. 도로 쪽(+z)을 본다. signs = 위층부터 한 층 한 판 */
function building(cx: number, w: number, floors: number, wall: 'wallA' | 'wallB', ups: [string, SignColor, string][], ground: [string, SignColor, string], opts: { door?: number; convenience?: boolean } = {}) {
  const g = new THREE.Group()
  const d = 11, zf = -SW1 // 정면 z
  const H = DIM.floor.ground + (floors - 1) * DIM.floor.upper
  const zc = zf - d / 2
  g.add(box(w, H, d, role(wall), cx, H / 2, zc))
  g.add(box(w + 0.3, 0.35, d + 0.3, fixed('#9AA0AA'), cx, H + 0.17, zc)) // 옥상 난간
  g.add(box(1.4, 1, 1, fixed('#B0B6BD'), cx - w / 4, H + 0.85, zc - 2)) // 실외기
  g.add(box(1.6, 1.6, 1.6, fixed('#8FA3B8'), cx + w / 4, H + 1.15, zc - 3)) // 물탱크
  const glassMat = new THREE.MeshStandardMaterial({ roughness: 0.25, flatShading: true, emissive: 0xffd58a, emissiveIntensity: 0 })
  glassMats.push(glassMat)
  // 1층
  g.add(box(w * 0.9, 2.6, 0.1, glassMat, cx, 1.4, zf + 0.06))
  const gs = sign(ground[0], ground[1], ground[2], w * 0.9, 0.85)
  gs.position.set(cx, 3.35, zf + 0.12); g.add(gs)
  if (opts.convenience) { // 편의점: 3색 띠 + 진열대 실루엣 + 파라솔 테이블
    ;(['signBlue', 'signGreen', 'signRed'] as const).forEach((k, i) => {
      const m = new THREE.MeshStandardMaterial({ roughness: 0.6 }); bandMats.push({ m, k })
      g.add(box(w * 0.9, 0.08, 0.13, m, cx, 2.86 - i * 0.08, zf + 0.12))
    })
    for (const dz of [-1.5, -3]) g.add(box(w * 0.7, 1.4, 0.4, fixed('#C9CED6'), cx, 0.7, zf + dz))
    const table = new THREE.Group()
    table.add(box(0.9, 0.05, 0.9, fixed('#F4F4F0'), 0, 0.75, 0), box(0.06, 2.2, 0.06, fixed('#9AA0AA'), 0, 1.1, 0))
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 8), fixed('#3E8C5E')); um.position.y = 2.3; table.add(um)
    table.position.set(cx + w / 3, 0.18, -SW0 - 2.2); g.add(table)
  }
  if (opts.door !== undefined) { // 학원 출입구: 유리문 + 계단 2단
    g.add(box(2.2, 2.4, 0.14, fixed('#7E9AB0', { roughness: 0.2 }), opts.door, 1.4, zf + 0.12))
    g.add(box(3, 0.15, 0.6, fixed('#B9B4AA'), opts.door, 0.25, zf + 0.35), box(3, 0.15, 0.3, fixed('#B9B4AA'), opts.door, 0.4, zf + 0.2))
  }
  // 위층: 창 띠 + 간판 한 판
  for (let f = 1; f < floors; f++) {
    const y = DIM.floor.ground + (f - 1) * DIM.floor.upper
    g.add(box(w * 0.88, 1.2, 0.1, glassMat, cx, y + 1.85, zf + 0.06))
    const up = ups[f - 1]
    if (up) { const s = sign(up[0], up[1], up[2], w * 0.82, 0.9); s.position.set(cx, y + 0.7, zf + 0.12); g.add(s) }
  }
  // 세로 돌출 간판 1개
  if (ups.length >= 2) {
    const v = sign(ups[0][0].replace(/\s/g, '').slice(0, 4), 'white', '#C9483F', H * 0.55, 0.9, true)
    v.position.set(cx + w / 2 - 0.6, H * 0.6, zf + 0.6); g.add(v)
  }
  return g
}
const glassMats: THREE.MeshStandardMaterial[] = []
const bandMats: { m: THREE.MeshStandardMaterial; k: 'signBlue' | 'signGreen' | 'signRed' }[] = []

function tree(x: number, z: number, s = 1) {
  const g = new THREE.Group()
  g.add(box(0.3, 2.6 * s, 0.3, fixed('#8B6B4A'), 0, 1.3 * s, 0))
  // 은행나무형 원뿔 잎
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.5 * s, 3.4 * s, 7), role('leaf')); c1.position.y = 3.9 * s; c1.castShadow = true
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.0 * s, 2.0 * s, 7), role('leaf')); c2.position.y = 5.2 * s; c2.castShadow = true
  g.add(c1, c2, box(1.2, 0.05, 1.2, fixed('#7A6A58'), 0, 0.2, 0))
  g.position.set(x, 0, z)
  return g
}

/** 일반형 차 소품 (무대 배경). 주인공 차는 car.ts */
export function propCar(color: string, len = 4.5, h = 1.5) {
  const g = new THREE.Group()
  const paint = fixed(color)
  g.add(box(len, 0.7, 1.85, paint, 0, 0.62, 0))
  g.add(box(len * 0.55, 0.55, 1.65, fixed('#334455', { roughness: 0.3 }), -0.15, 1.22, 0))
  g.add(box(len * 0.5, 0.06, 1.67, paint, -0.15, h - 0.02, 0))
  for (const [wx, wz] of [[1, 0.85], [1, -0.85], [-1, 0.85], [-1, -0.85]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 10), fixed('#1F1F22'))
    w.rotation.x = Math.PI / 2; w.position.set(wx * len * 0.32, 0.34, wz); g.add(w)
  }
  return g
}

function academyBus() {
  const g = new THREE.Group()
  const { len, width, height } = DIM.bus
  g.add(box(len, height - 0.45, width, role('bus'), 0, 0.45 + (height - 0.45) / 2, 0))
  g.add(box(len * 0.82, 0.7, width + 0.02, fixed('#334455', { roughness: 0.3 }), -0.2, height - 0.65, 0))
  for (const s of [1, -1]) {
    const t = sign('어린이 보호차량', 'bus', '#1F1F29', 2.6, 0.45)
    t.position.set(-0.3, 1.15, s * (width / 2 + 0.07)); t.rotation.y = s > 0 ? 0 : Math.PI; g.add(t)
  }
  const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 8), fixed('#C9483F')) // 정지 표시판
  stop.rotation.x = Math.PI / 2; stop.position.set(len * 0.25, 1.4, -width / 2 - 0.1); g.add(stop)
  for (const [wx, wz] of [[2, 0.9], [2, -0.9], [-2, 0.9], [-2, -0.9]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.28, 10), fixed('#1F1F22'))
    w.rotation.x = Math.PI / 2; w.position.set(wx, 0.4, wz); g.add(w)
  }
  return g
}

function person(color: string, h: number = DIM.person.student) {
  const g = new THREE.Group()
  const k = h / 1.6
  g.add(box(0.36 * k, 0.72 * k, 0.24 * k, fixed('#3A3F4A'), 0, 0.36 * k, 0)) // 다리
  g.add(box(0.42 * k, 0.6 * k, 0.28 * k, fixed(color), 0, 1.02 * k, 0)) // 몸
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * k * 1.1, 8, 6), fixed('#F1C8A5')) // 머리 1.1배
  head.position.y = 1.47 * k; head.castShadow = true; g.add(head)
  g.add(box(0.3 * k, 0.38 * k, 0.14 * k, fixed('#2B2F36'), 0, 1.05 * k, -0.2 * k)) // 학원 가방
  return g
}

function trafficSignal(x: number, z: number, rotY: number) {
  const g = new THREE.Group()
  const pole = fixed('#6B7078')
  const arm = 6
  g.add(box(0.2, DIM.signalPole, 0.2, pole, 0, DIM.signalPole / 2, 0))
  g.add(box(0.14, 0.14, arm, pole, 0, DIM.signalPole - 0.2, -arm / 2))
  g.add(box(0.4, 0.45, 1.5, fixed('#2B2F36'), 0, DIM.signalPole - 0.2, -arm + 0.6))
  const lamp = (c: string) => fixed('#2B2F36', { emissive: c }) // 꺼진 등은 어둡게, 켜진 등만 발광
  const lamps = { red: lamp('#FF3B30'), yellow: lamp('#FFCC00'), green: lamp('#34C759') }
  ;(['red', 'yellow', 'green'] as Light[]).forEach((k, i) => { // 한국 가로형 3구: 왼쪽부터 빨강·노랑·초록
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), lamps[k])
    m.rotation.z = Math.PI / 2; m.position.set(-0.24, DIM.signalPole - 0.2, -arm + 0.6 + (i - 1) * 0.45); g.add(m)
  })
  g.position.set(x, 0, z); g.rotation.y = rotY
  return { g, lamps }
}

function pedSignal(x: number, z: number) {
  const g = new THREE.Group()
  g.add(box(0.12, 2.6, 0.12, fixed('#6B7078'), 0, 1.3, 0), box(0.4, 0.8, 0.4, fixed('#2B2F36'), 0, 2.7, 0))
  const red = fixed('#2B2F36', { emissive: '#FF3B30' }), green = fixed('#2B2F36', { emissive: '#34C759' })
  g.add(box(0.42, 0.3, 0.3, red, 0, 2.88, 0), box(0.42, 0.3, 0.3, green, 0, 2.5, 0))
  g.position.set(x, 0, z)
  return { g, red, green }
}

function catenary(a: THREE.Vector3, b: THREE.Vector3, sag: number) {
  const pts = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    return new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0))
  })
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.025, 4), fixed('#2B2F36'))
}

function gradientSky(th: Theme) {
  const c = document.createElement('canvas'); c.width = 2; c.height = 256
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, th.skyTop); grd.addColorStop(1, th.skyBottom)
  g.fillStyle = grd; g.fillRect(0, 0, 2, 256)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function buildStage(scene: THREE.Scene) {
  const root = new THREE.Group()
  scene.add(root)
  const slabW = HALF_X * 2, slabD = 70

  // 떠 있는 땅 조각
  root.add(box(slabW, 3, slabD, fixed('#8A6F55'), 0, -1.55, 0))
  root.add(box(slabW - 0.8, 1.2, slabD - 0.8, fixed('#6E5643'), 0, -3.6, 0))
  root.add(box(slabW, 0.1, slabD, fixed('#C9D3BE'), 0, -0.05, 0))
  // 도로와 노면 표시
  root.add(box(slabW, 0.04, ROAD_HALF * 2, role('asphalt'), 0, 0, 0))
  for (const dz of [-0.15, 0.15]) root.add(box(slabW, 0.02, 0.12, role('lineYellow'), 0, 0.03, dz)) // 중앙선 황색 실선 2줄
  for (const zz of [-ROAD_HALF + 0.2, ROAD_HALF - 0.2]) root.add(box(slabW, 0.02, 0.15, role('lineWhite'), 0, 0.03, zz))
  for (let x = -HALF_X + 2; x < HALF_X; x += 8) {
    if (x > DIM.crosswalk.x0 - 8 && x < DIM.crosswalk.x1 + 6) continue
    for (const zz of [-DIM.lane, DIM.lane]) root.add(box(3, 0.02, 0.15, role('lineWhite'), x, 0.03, zz)) // 백색 점선
  }
  const cw = DIM.crosswalk
  for (let zz = -ROAD_HALF + cw.bar / 2 + 0.2; zz < ROAD_HALF - 0.2; zz += cw.bar + cw.gap) root.add(box(cw.x1 - cw.x0, 0.02, cw.bar, role('lineWhite'), CROSS_X, 0.035, zz))
  root.add(box(DIM.stopLine.width, 0.02, ROAD_HALF, role('lineWhite'), STOP_LINE.west, 0.03, -ROAD_HALF / 2))
  root.add(box(DIM.stopLine.width, 0.02, ROAD_HALF, role('lineWhite'), STOP_LINE.east, 0.03, ROAD_HALF / 2))
  const slow = sign('천천히', 'white', '#F4F4F0', 3.2, 1.4)
  ;(slow.material as THREE.MeshStandardMaterial).transparent = true
  slow.rotation.set(-Math.PI / 2, 0, Math.PI / 2); slow.position.set(32, 0.04, LANES.west[1]); root.add(slow)

  // 보도·연석·점자블록·볼라드·가로수
  const joint = fixed('#1F1F29', { transparent: true, opacity: 0.12 })
  for (const s of [1, -1]) {
    root.add(box(slabW, 0.18, DIM.sidewalk, role('sidewalk'), 0, 0.09, s * (SW0 + SW1) / 2))
    for (let x = -HALF_X + 1; x < HALF_X; x += 2) root.add(box(0.03, 0.005, DIM.sidewalk, joint, x, 0.185, s * (SW0 + SW1) / 2)) // 보도블록 줄눈
    root.add(box(slabW, 0.22, 0.25, role('curb'), 0, 0.11, s * (ROAD_HALF + 0.12)))
    root.add(box(cw.x1 - cw.x0, 0.02, 0.8, fixed('#E8B53A'), CROSS_X, 0.19, s * (SW0 + 0.8))) // 점자블록
    for (let bx = cw.x0 - 1.5; bx <= cw.x1 + 1.6; bx += DIM.bollard.gap) {
      const b = new THREE.Group()
      const body = new THREE.Mesh(new THREE.CylinderGeometry(DIM.bollard.d / 2, DIM.bollard.d / 2 + 0.01, DIM.bollard.h, 8), role('curb'))
      const band = new THREE.Mesh(new THREE.CylinderGeometry(DIM.bollard.d / 2 + 0.005, DIM.bollard.d / 2 + 0.005, 0.12, 8), fixed('#1F1F29'))
      body.position.y = DIM.bollard.h / 2; band.position.y = DIM.bollard.h * 0.8; body.castShadow = true
      b.add(body, band); b.position.set(bx, 0.18, s * (SW0 + 0.4)); root.add(b)
    }
    for (let x = -HALF_X + 4; x < HALF_X; x += DIM.tree.gap) {
      if ((x > cw.x0 - 3 && x < cw.x1 + 3) || Math.abs(x - DIM.busStopX) < 4 || Math.abs(x - DIM.academyDoorX) < 3) continue
      root.add(tree(x, s * (SW1 - 0.9), 0.95))
    }
  }

  // 북쪽 상가 4동 (서→동): 독서실 상가 · 학원 상가 · 학원 상가(5층, 출입구 x=-4) · 편의점+학원
  root.add(building(-41, 14, 4, 'wallA', [['독서실', 'signBlue', '#F4F4F0'], ['스터디카페', 'signGreen', '#F4F4F0'], ['입시', 'signRed', '#F4F4F0']], ['분식', 'signRed', '#F4F4F0']))
  root.add(building(-23, 16, 5, 'wallB', [['수학 전문', 'signBlue', '#F4F4F0'], ['영어 입시', 'signRed', '#F4F4F0'], ['국어 논술', 'signGreen', '#F4F4F0'], ['과학 탐구', 'signBlue', '#F4F4F0']], ['문구', 'store', '#3A3F4A']))
  root.add(building(-4, 16, 5, 'wallA', [['수학', 'signBlue', '#F4F4F0'], ['영어', 'signRed', '#F4F4F0'], ['국어논술', 'signGreen', '#F4F4F0'], ['독서실', 'signBlue', '#F4F4F0']], ['학원 입구', 'white', '#3A3F4A'], { door: DIM.academyDoorX }))
  root.add(building(15, 16, 4, 'wallB', [['코딩', 'signGreen', '#F4F4F0'], ['영재 수학', 'signBlue', '#F4F4F0'], ['피아노', 'signRed', '#F4F4F0']], ['편의점 24시', 'store', '#3A63A8'], { convenience: true }))
  // 남쪽: 아파트 단지 담장·녹지 (먼 배경 건물은 등각 회전 때 화면을 가려 뺐다)
  root.add(box(slabW, 0.12, slabD / 2 - SW1, fixed('#B9C8A8'), 0, 0.06, SW1 + (slabD / 2 - SW1) / 2))
  root.add(box(slabW, 1.4, 0.2, fixed('#C9B8A0'), 0, 0.7, SW1 + 1.2))
  for (const x of [-42, -24, -6, 8, 28, 44]) root.add(tree(x, SW1 + 4, 1.1))

  // 버스정류장 (북쪽 보도 x=-30)
  const shelter = new THREE.Group()
  shelter.add(box(4, 0.1, 1.6, fixed('#6B7078'), 0, 2.6, 0), box(4, 2.2, 0.06, fixed('#9FB8C8', { transparent: true, opacity: 0.5 }), 0, 1.5, -0.75))
  shelter.add(box(3, 0.08, 0.4, fixed('#8B6B4A'), 0, 0.5, -0.45), box(0.1, 2.6, 0.1, fixed('#6B7078'), 1.9, 1.3, -0.7), box(0.1, 2.6, 0.1, fixed('#6B7078'), -1.9, 1.3, -0.7))
  const route = sign('정류장 · 7 · 12 · 마을01', 'signBlue', '#F4F4F0', 1.6, 0.5); route.position.set(2.6, 2.4, 0.3); shelter.add(route, box(0.08, 2.4, 0.08, fixed('#6B7078'), 2.6, 1.2, 0.3))
  shelter.position.set(DIM.busStopX, 0.18, -(SW0 + SW1) / 2 - 0.3); root.add(shelter)

  // 전봇대 2개 + 처진 전선 + 변압기
  const poles = [-20, 10].map(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(DIM.pole.d / 2, DIM.pole.d / 2 + 0.05, DIM.pole.h, 8), fixed('#B9B4AA')); p.position.set(x, DIM.pole.h / 2, -SW1 + 0.5); p.castShadow = true; root.add(p); return p })
  root.add(box(0.6, 0.9, 0.6, fixed('#7A8088'), -20, 7.6, -SW1 + 0.15))
  for (const dy of [0, -0.6]) root.add(catenary(new THREE.Vector3(poles[0].position.x, 9.4 + dy, poles[0].position.z), new THREE.Vector3(poles[1].position.x, 9.4 + dy, poles[1].position.z), 1.2))
  // 현수막 (나무 사이)
  const banner = sign('수강생 모집', 'white', '#C9483F', DIM.banner.w, DIM.banner.h); banner.position.set(-20 + 2.8, DIM.banner.y + 0.18, -SW1 + 0.9); root.add(banner)

  // 가로등
  const lampMat = new THREE.MeshStandardMaterial({ color: '#FFF1C1', emissive: '#FFE2B0', emissiveIntensity: 0 })
  const pointLights: THREE.PointLight[] = []
  for (const [lx, s] of [[-34, -1], [-8, 1], [6, -1], [32, 1]] as [number, number][]) {
    root.add(box(0.15, 7, 0.15, fixed('#6B7078'), lx, 3.5, s * (SW0 + 0.6)))
    root.add(box(0.12, 0.12, 1.8, fixed('#6B7078'), lx, 6.95, s * (SW0 - 0.3)))
    root.add(box(0.6, 0.15, 0.4, lampMat, lx, 6.85, s * (SW0 - 1.1)))
    const pl = new THREE.PointLight('#FFE2B0', 0, 24, 1.5); pl.position.set(lx, 6.5, s * (SW0 - 1.1))
    root.add(pl); pointLights.push(pl)
  }

  // 신호등: 서행 차로(북)는 x=26에 서서 건너편 x=18의 신호를, 동행 차로(남)는 그 반대
  const sigW = trafficSignal(STOP_LINE.east, -SW0 - 0.6, Math.PI) // 팔이 남쪽(+z)으로, 등이 +x를 본다
  const sigE = trafficSignal(STOP_LINE.west, SW0 + 0.6, 0)
  root.add(sigW.g, sigE.g)
  const peds = [pedSignal(cw.x0 - 0.6, -SW0 - 0.8), pedSignal(cw.x1 + 0.6, SW0 + 0.8)]
  peds.forEach(p => root.add(p.g))

  // 서 있는 차: 학원 버스(북쪽 갓길 x=-13), 남쪽 갓길 일반 차
  const bus = academyBus(); bus.position.set(DIM.academyBusX, 0, LANES.west[1]); bus.rotation.y = Math.PI; root.add(bus)
  OBSTACLES.push({ x: DIM.academyBusX, z: LANES.west[1], len: DIM.bus.len })
  const parked = propCar('#5F7ADB'); parked.position.set(-28, 0, LANES.east[1]); root.add(parked)
  OBSTACLES.push({ x: -28, z: LANES.east[1], len: 4.5 })
  // 지나가는 차 2대 (신호를 지킨다, 주인공 차와 충돌 처리는 없음)
  const movers = [
    { g: propCar('#C9483F'), z: LANES.east[0], dir: 1, x: -30, v: 0 },
    { g: propCar('#3A3F4A'), z: LANES.west[0], dir: -1, x: 40, v: 0 },
  ]
  movers.forEach(m => { m.g.rotation.y = m.dir > 0 ? 0 : Math.PI; root.add(m.g) })

  // 사람: 보도 걷기, 출입구 앞 기다리기, 정류장, 횡단보도 건너기
  const colors = ['#C9483F', '#3A63A8', '#E8B53A', '#3E8C5E', '#9AA0AA', '#D99A3A']
  const walkers = colors.map((c, i) => { const p = person(c, i === 4 ? DIM.person.adult : DIM.person.student); root.add(p); return { p, side: i % 2 ? 1 : -1, speed: 1.3, phase: i * 13 } })
  const waiting = [person('#3A63A8'), person('#E8B53A', DIM.person.child), person('#9AA0AA', DIM.person.adult)]
  waiting[0].position.set(DIM.academyDoorX - 1, 0.18, -SW0 - 1.2); waiting[1].position.set(DIM.academyDoorX + 0.8, 0.18, -SW0 - 1.5)
  waiting[2].position.set(DIM.busStopX + 0.5, 0.18, -SW0 - 1.5); waiting.forEach(p => { p.rotation.y = 0; root.add(p) })
  const crossers = [person('#E8B53A'), person('#C9483F', DIM.person.adult)]
  crossers.forEach(c => root.add(c))

  // 조명: 반구광 + 방향광(그림자) + HDRI 환경광(있으면, 배경으로는 쓰지 않음)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1)
  const sun = new THREE.DirectionalLight(0xffffff, 2)
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 45, bottom: -45, near: 1, far: 250 })
  sun.shadow.bias = -0.0004
  scene.add(hemi, sun, sun.target)

  let time: TimeOfDay | null = null
  let envs: Partial<Record<TimeOfDay, THREE.Texture>> = {}
  function setTime(t: TimeOfDay, force = false) {
    if (t === time && !force) return
    time = t
    const th = THEME[t]
    scene.background = gradientSky(th)
    scene.environment = envs[t] ?? null
    scene.environmentIntensity = th.env
    for (const r of ['asphalt', 'sidewalk', 'curb', 'lineWhite', 'lineYellow', 'wallA', 'wallB', 'leaf', 'bus', 'store'] as Role[]) role(r).color.set(th[r as keyof Theme] as string)
    glassMats.forEach(m => { m.color.set(th.glass); m.emissive.set(th.glass); m.emissiveIntensity = th.glassGlow * 0.9 })
    bandMats.forEach(({ m, k }) => { m.color.set(th[k]); m.emissive.set(th[k]); m.emissiveIntensity = th.signGlow })
    signs.forEach(s => { s.draw(th); s.mat.emissiveIntensity = th.signGlow * 0.85 })
    hemi.color.set(th.skyTop); hemi.groundColor.set(th.sidewalk); hemi.intensity = th.hemi
    const el = THREE.MathUtils.degToRad(th.sunElev), az = THREE.MathUtils.degToRad(t === 'dusk' ? 250 : 140)
    sun.position.set(Math.cos(az) * Math.cos(el) * 100, Math.sin(el) * 100, Math.sin(az) * Math.cos(el) * 100)
    sun.color.set(th.sunColor); sun.intensity = th.sun; sun.visible = th.sun > 0
    lampMat.emissiveIntensity = th.streetLight ? 2.5 : 0
    pointLights.forEach(pl => { pl.intensity = th.streetLight ? (t === 'night' ? 90 : 35) : 0; if (th.streetLight) pl.color.set(th.streetLight) })
  }
  /** HDRI는 scripts/fetch-hdri.sh 로 받은 뒤에만 쓴다. 없으면 반구광만으로 돈다 */
  async function loadEnv(renderer: THREE.WebGLRenderer) {
    const { HDRLoader } = await import('three/examples/jsm/loaders/HDRLoader.js')
    const pmrem = new THREE.PMREMGenerator(renderer)
    await Promise.all((Object.keys(THEME) as TimeOfDay[]).map(async t => {
      try {
        const tex = await new HDRLoader().loadAsync(`${import.meta.env.BASE_URL}hdri/${THEME[t].hdri}_1k.hdr`)
        envs[t] = pmrem.fromEquirectangular(tex).texture; tex.dispose()
      } catch { /* 파일 없음: 환경광 없이 */ }
    }))
    if (time) setTime(time, true)
    return Object.keys(envs).length
  }

  function update(t: number, dt: number) {
    const L = carLight(t)
    for (const sig of [sigE, sigW]) (Object.keys(sig.lamps) as Light[]).forEach(k => { sig.lamps[k].emissiveIntensity = k === L ? 2.4 : 0.03 })
    const pg = pedGreen(t)
    peds.forEach(p => { p.green.emissiveIntensity = pg ? 2 : 0.03; p.red.emissiveIntensity = pg ? 0.03 : 2 })
    walkers.forEach(w => {
      const span = 80, d = (t * w.speed + w.phase) % (span * 2)
      const x = d < span ? -40 + d : 40 - (d - span)
      w.p.position.set(x, 0.18 + Math.abs(Math.sin(t * 7 + w.phase)) * 0.05, w.side * (SW0 + 2.2 + (w.phase % 3) * 0.3))
      w.p.rotation.y = d < span ? Math.PI / 2 : -Math.PI / 2
    })
    const p = t % CYCLE, k = Math.floor(t / CYCLE) % 2
    crossers.forEach((c, i) => {
      const f = THREE.MathUtils.clamp((p - 16 - i * 0.7) / 6, 0, 1)
      const zA = (k ? 1 : -1) * (SW0 + 1), zB = -zA
      c.position.set(CROSS_X - 0.8 + i * 1.5, f > 0 && f < 1 ? 0.03 : 0.18, THREE.MathUtils.lerp(zA, zB, f))
      c.rotation.y = zB > zA ? 0 : Math.PI
    })
    movers.forEach(m => {
      const stopX = m.dir > 0 ? STOP_LINE.east : STOP_LINE.west
      const toStop = (stopX - m.x) * m.dir - 2.3
      let vMax = 9
      if (L !== 'green' && toStop > -0.5 && toStop < 40) vMax = Math.min(vMax, Math.sqrt(Math.max(0, 5 * toStop)))
      m.v = m.v < vMax ? Math.min(vMax, m.v + 2 * dt) : Math.max(vMax, m.v - 4 * dt)
      m.x += m.dir * m.v * dt
      if (m.x > HALF_X) m.x -= 2 * HALF_X
      if (m.x < -HALF_X) m.x += 2 * HALF_X
      m.g.position.set(m.x, 0, m.z)
    })
  }

  return { root, setTime, update, loadEnv }
}
