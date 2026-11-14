// 한 페이지 멀티 뷰 + 새 창(BroadcastChannel). 주인 창 하나만 물리·자율·연결기를 돌리고, 나머지는 상태를 받아 그린다.
// 주인은 Web Locks로 하나만 뽑힌다. 주인 창이 닫히면 잠금이 풀려 기다리던 창이 이어받는다.
import * as THREE from 'three'
import { getState, replaceState, setState, subscribe, type Patch, type SimState } from './state.ts'
import { buildStage } from './scene/stage.ts'
import { buildCar } from './scene/car.ts'
import { CAM, DIM, THEME } from './scene/theme.ts'
import { DRIVE_KEYS, pressKey, releaseAll, releaseKey, step } from './drive.ts'
import { connect, disconnect, isConnected, tele } from './bridge/pleos/connector.ts'
import { buildControls, renderCluster, renderTelemetry } from './ui/panel.ts'

type Cam = 'diorama' | 'driver' | 'chase' | 'pedestrian'
const params = new URLSearchParams(location.search)
const solo = params.get('view') as Cam | 'telemetry' | null
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

// ---- 상태 공유 ----
const bc = new BroadcastChannel('mangsang-sim')
let remoteTele: typeof tele = tele
let clock = 0
let owner = false
const toggleLink = () => (isConnected() ? disconnect() : connect())
function becomeOwner() {
  owner = true
  // 전 주인이 연결해 두었으면 이어서 연결한다
  if (params.get('connect') === '1' || remoteTele.status !== 'off') connect()
}
// shortcut: 잠금 API가 없는 환경(보안 컨텍스트 아님, 예: LAN IP http)은 예전처럼 ?view= 없는 창이 주인. 그런 환경에서 쓰면 잠금 대신 BroadcastChannel 선출로 바꾼다.
if (navigator.locks) navigator.locks.request('mangsang-sim-owner', () => new Promise(() => becomeOwner()))
else if (!solo) becomeOwner()
const act = (p: Patch) => (owner ? setState(p) : bc.postMessage({ type: 'patch', patch: p }))
bc.onmessage = e => {
  const m = e.data
  if (owner) {
    if (m.type === 'patch') setState(m.patch)
    if (m.type === 'key') (m.down ? pressKey(m.key) : releaseKey(m.key))
    if (m.type === 'link') toggleLink()
  } else {
    if (m.type === 'state') { replaceState(m.state as SimState); clock = m.t }
    if (m.type === 'tele') remoteTele = m.tele
  }
}
addEventListener('keydown', e => {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return
  if (DRIVE_KEYS.includes(e.key)) e.preventDefault()
  if (e.repeat) return
  owner ? pressKey(e.key) : bc.postMessage({ type: 'key', key: e.key, down: true })
})
addEventListener('keyup', e => (owner ? releaseKey(e.key) : bc.postMessage({ type: 'key', key: e.key, down: false })))
addEventListener('blur', () => (owner ? releaseAll() : DRIVE_KEYS.forEach(key => bc.postMessage({ type: 'key', key, down: false }))))

// ---- 3D ----
const renderer = new THREE.WebGLRenderer({ canvas: $('gl') as unknown as HTMLCanvasElement, antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
const scene = new THREE.Scene()
const stage = buildStage(scene)
stage.loadEnv(renderer).then(n => console.info(`HDRI ${n}/3`))
const car = buildCar()
scene.add(car.root)
const goalMark = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 4), new THREE.MeshStandardMaterial({ color: '#F4F4F0', emissive: '#F4F4F0', emissiveIntensity: 0.4 }))
goalMark.rotation.x = Math.PI; scene.add(goalMark)

const iso = new THREE.OrthographicCamera(-20, 20, 10, -10, -200, 400)
const persp: Record<Exclude<Cam, 'diorama'>, THREE.PerspectiveCamera> = {
  driver: new THREE.PerspectiveCamera(CAM.driver.fov, 1, CAM.driver.near, 500),
  chase: new THREE.PerspectiveCamera(CAM.chase.fov, 1, 0.1, 500),
  pedestrian: new THREE.PerspectiveCamera(CAM.pedestrian.fov, 1, 0.1, 500),
}
let isoTurn = 0, isoAz = CAM.iso.azimuthDeg, isoWide = false
const isoTarget = new THREE.Vector3()
let sideCam: Exclude<Cam, 'diorama'> = 'driver'

function placeCameras(dt: number) {
  const { x, z } = getState().pose
  const az = CAM.iso.azimuthDeg + isoTurn * 90
  isoAz += (az - isoAz) * Math.min(1, dt / (CAM.iso.turnSec / 4))
  isoTarget.lerp(isoWide ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(x, 0, z), Math.min(1, dt * 3))
  const el = THREE.MathUtils.degToRad(CAM.iso.elevDeg), a = THREE.MathUtils.degToRad(isoAz)
  iso.position.set(isoTarget.x + Math.cos(el) * Math.sin(a) * 120, Math.sin(el) * 120, isoTarget.z + Math.cos(el) * Math.cos(a) * 120)
  iso.lookAt(isoTarget)
  car.root.updateMatrixWorld()
  const w = (lx: number, ly: number, lz: number) => car.root.localToWorld(new THREE.Vector3(lx, ly, lz))
  const pitch = Math.tan(THREE.MathUtils.degToRad(CAM.driver.pitchDeg)) * 10
  persp.driver.position.copy(w(-0.22, DIM.eye.driver, -DIM.eye.driverLeft))
  persp.driver.lookAt(w(10, DIM.eye.driver + pitch, -DIM.eye.driverLeft))
  persp.chase.position.lerp(w(-CAM.chase.back, CAM.chase.up, 0), Math.min(1, dt / 0.15))
  persp.chase.lookAt(w(CAM.chase.lookAhead, 0.8, 0))
  persp.pedestrian.position.set(DIM.academyDoorX + 1.5, CAM.pedestrian.eye + 0.18, -8.2)
  persp.pedestrian.lookAt(car.root.position.clone().setY(1))
}

function render(el: HTMLElement, cam: Cam) {
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return
  const y = innerHeight - r.bottom
  renderer.setViewport(r.left, y, r.width, r.height)
  renderer.setScissor(r.left, y, r.width, r.height)
  const aspect = r.width / r.height
  const driverSeat = car.root.getObjectByName('seat_driver')!
  driverSeat.visible = getState().car.seats.driver && cam !== 'driver'
  if (cam === 'diorama') {
    const half = (isoWide ? CAM.iso.widthOut : CAM.iso.width) / 2
    Object.assign(iso, { left: -half, right: half, top: half / aspect, bottom: -half / aspect })
    iso.updateProjectionMatrix()
    renderer.render(scene, iso)
  } else {
    const p = persp[cam]; p.aspect = aspect; p.updateProjectionMatrix()
    renderer.render(scene, p)
  }
}

// ---- 화면 ----
const mainEl = $('v-main'), sideEl = $('v-side')
const panes = () => {
  const m = getState().mode
  return { main: (m === 'sim' ? 'diorama' : sideCam) as Cam, side: (m === 'sim' ? sideCam : 'diorama') as Cam }
}
const CAM_LABEL: Record<Cam, string> = { diorama: '등각 디오라마 · 웹 시뮬레이터 화면 (실제 차 아님)', driver: '운전석 시점', chase: '차 추적 시점', pedestrian: '보행자 시점 (학원 출입구)' }

if (solo) {
  document.body.classList.add('solo')
  ;(solo === 'telemetry' ? $('v-tele') : mainEl).classList.add('solo-on')
  if (solo === 'driver' || solo === 'chase' || solo === 'pedestrian') { mainEl.append($('cluster')) }
}

const controls = buildControls($('controls'), act, () => { picking = true; mainEl.style.cursor = 'copy' })
controls.bindCurrent(getState)
let picking = false
mainEl.addEventListener('click', e => {
  if (!picking || panes().main !== 'diorama') return
  const r = mainEl.getBoundingClientRect()
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, iso)
  const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3())
  if (hit) act({ goal: { x: hit.x, z: hit.z }, car: { adMode: 'full_autonomous', gear: 'Drive' } })
  picking = false; mainEl.style.cursor = ''
})

$('modeSeg').onclick = e => { const m = (e.target as HTMLElement).dataset.mode; if (m) act({ mode: m as SimState['mode'] }) }
$('timeSeg').onclick = e => { const t = (e.target as HTMLElement).dataset.time; if (t) act({ time: t as SimState['time'] }) }
$('rotate').onclick = () => { isoTurn++ }
$('zoom').onclick = () => { isoWide = !isoWide; $('zoom').textContent = isoWide ? '⤡ 가깝게' : '⤢ 넓게' }
$('link').onclick = () => (owner ? toggleLink() : bc.postMessage({ type: 'link' }))
sideEl.addEventListener('dblclick', () => { sideCam = sideCam === 'driver' ? 'chase' : sideCam === 'chase' ? 'pedestrian' : 'driver' })
document.querySelectorAll<HTMLButtonElement>('.pop').forEach(b => b.onclick = () => {
  const v = b.dataset.view === 'telemetry' ? 'telemetry' : panes()[b.dataset.view as 'main' | 'side']
  window.open(`${location.pathname}?view=${v}`, `sim-${v}`, 'width=1100,height=700')
})

// 에뮬레이터 화면: scripts/emu-screencap.sh 가 public/emu.png 를 갱신하면 보인다
const emuImg = $('emuImg') as HTMLImageElement
// 같은 그림을 차 중앙 디스플레이 텍스처로도 쓴다 (운전석 시점, 새 창 포함)
const emuTex = new THREE.Texture(emuImg)
emuTex.colorSpace = THREE.SRGBColorSpace
car.displayMat.map = emuTex
emuImg.onload = () => { emuImg.style.display = 'block'; $('emuHint').style.display = 'none'; emuTex.needsUpdate = true; car.displayScreen.visible = true }
emuImg.onerror = () => { emuImg.style.display = 'none'; $('emuHint').style.display = ''; car.displayScreen.visible = false }
setInterval(() => { if (solo !== 'telemetry') emuImg.src = `/emu.png?t=${Date.now()}` }, 1000)

// ---- 루프 ----
let last = performance.now(), frame = 0, lastBroadcast = 0
subscribe((s, prev) => { if (s.time !== prev.time) stage.setTime(s.time) })
stage.setTime(getState().time)
;(window as any).sim = { getState, setState, tele, isOwner: () => owner } // 검증·녹화 스크립트용

function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; frame++
  if (owner) {
    clock += dt
    step(dt, clock)
    if (now - lastBroadcast > 50) { bc.postMessage({ type: 'state', state: getState(), t: clock }); lastBroadcast = now }
    if (frame % 15 === 0) bc.postMessage({ type: 'tele', tele: { status: tele.status, vc: tele.vc, sentInput: tele.sentInput, rtt: tele.rtt, pollMs: tele.pollMs, puts: tele.puts, message: tele.message, emu: tele.emu } })
  }
  const s = getState()
  stage.update(clock, dt)
  car.root.position.set(s.pose.x, 0, s.pose.z)
  car.root.rotation.y = s.pose.yaw
  const night = s.time === 'night' ? 1 : s.time === 'dusk' ? 0.5 : 0
  car.apply(s.car, dt, clock, night, 'outside', THEME[s.time], s.appGlow)
  goalMark.visible = !!s.goal
  if (s.goal) goalMark.position.set(s.goal.x, 1.2 + Math.sin(clock * 4) * 0.15, s.goal.z)
  placeCameras(dt)

  renderer.setSize(innerWidth, innerHeight, false)
  renderer.setScissorTest(false); renderer.setClearColor(0xf7f6f3); renderer.clear()
  renderer.setScissorTest(true)
  const p = panes()
  if (solo === 'telemetry') { /* 3D 없음 */ } else if (solo) render(mainEl, solo as Cam)
  else { render(mainEl, p.main); render(sideEl, p.side) }

  if (frame % 6 === 0) {
    const tl = owner ? tele : remoteTele
    renderCluster($('cluster'), s.car, clock)
    if (frame % 12 === 0) {
      renderTelemetry($('tele'), s.car, tl)
      controls.refresh(s)
      const clusterHome = solo ? mainEl : p.main !== 'diorama' ? mainEl : sideEl
      if ($('cluster').parentElement !== clusterHome) clusterHome.append($('cluster'))
      $('mainLabel').textContent = CAM_LABEL[solo && solo !== 'telemetry' ? solo : p.main]
      $('sideLabel').textContent = `${CAM_LABEL[p.side]} · 더블클릭: 시점 바꾸기`
      const msg = $('linkMsg'); msg.textContent = tl.message ?? ''; msg.className = tl.status
      $('link').textContent = tl.status === 'off' ? '에뮬레이터 연결' : '연결 끊기'
      document.querySelectorAll<HTMLButtonElement>('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === s.mode))
      document.querySelectorAll<HTMLButtonElement>('#timeSeg button').forEach(b => b.classList.toggle('on', b.dataset.time === s.time))
    }
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
