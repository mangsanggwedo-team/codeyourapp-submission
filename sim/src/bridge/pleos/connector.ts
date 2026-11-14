// 연결기: 상태 → Virtual Console. 실패해도 무대는 돈다 (무대 루프와 따로 setInterval로 돈다).
import { getState } from '../../state.ts'
import { changed, emuValue, ROWS } from './channels.ts'

const BASE = 'http://127.0.0.1:8088' // adb forward tcp:8088 tcp:8088
const CLIENT = 'mangsang-sim'
const FLUSH_MS = 200 // 묶음 전송 초당 최대 5회
const RESYNC_MS = 2000 // 에뮬레이터 값이 이만큼 다르면 다시 보낸다 (실측: 비상등이 다른 쓰기에 꺼짐)

export interface Telemetry {
  status: 'off' | 'connecting' | 'ok' | 'error'
  message: string
  vc: any // 마지막 GET /vehicle/state
  sent: Record<string, string> // 요청 id → 마지막으로 보낸 경로
  sentInput: Record<string, string> // 행 label → 보낼 때의 넣은 값
  rtt: Record<string, number> // 요청 id → PUT 왕복 ms
  pollMs: number
  puts: number
  emu: Record<string, string> // 행 label → 에뮬레이터 값 (점멸 보정 후)
}

export const tele: Telemetry = { status: 'off', message: '연결 안 됨 · 무대만 돈다', vc: null, sent: {}, sentInput: {}, rtt: {}, pollMs: 0, puts: 0, emu: {} }
const mismatchSince: Record<string, number> = {}
const lastTrue: Record<string, number> = {}
const MAX_PUTS = 2 // 동시 PUT 상한 (첫 동기화 18개가 GET·하트비트와 겹쳐 에뮬레이터를 누르지 않게)
let timers: number[] = []
let hbBusy = false, pollBusy = false, misses = 0
let gen = 0, ctl = new AbortController() // 연결 세대: 끊기 뒤 돌아온 응답은 버린다
const inflight = new Set<string>() // 보내는 중인 요청 id
const doneAt: Record<string, number> = {} // 요청 id → PUT 완료 시각. 그 뒤 시작한 GET만 비교한다

async function call(method: string, path: string) {
  const r = await fetch(BASE + path, { method, signal: AbortSignal.any([ctl.signal, AbortSignal.timeout(4000)]) })
  if (!r.ok) throw new Error(`${method} ${path.split('?')[0]} ${r.status}`)
  return r
}

// 세션 하트비트가 있어야 콘솔 브리지가 준비된다(bridge_ready). 서버 타임아웃 3초, 우리는 1초마다.
async function heartbeat() {
  if (hbBusy) return
  hbBusy = true
  const g = gen
  try {
    await call('POST', `/browser/session?client=${CLIENT}`)
    if (g !== gen) return
    misses = 0
    if (tele.status !== 'ok') { tele.status = 'ok'; tele.message = '연결됨 · 값이 바뀔 때만 보낸다'; tele.sent = {} }
  } catch {
    if (g === gen && ++misses >= 3) { // 한 번 늦은 것으로 끊지 않는다 (맥 부하가 높으면 응답이 수 초 걸림)
      tele.status = 'error'
      tele.message = '연결 실패: 에뮬레이터 실행과 adb forward tcp:8088 tcp:8088 확인 · 무대는 계속 돈다'
    }
  } finally { if (g === gen) hbBusy = false }
}

// 항목별 최신 값만 보낸다: 빈 자리가 날 때 그 순간 상태로 경로를 만든다. 같은 요청은 한 번에 하나만.
function flush() {
  if (tele.status !== 'ok') return
  const g = gen
  for (const r of changed(getState().car, tele.sent)) {
    if (inflight.size >= MAX_PUTS) break
    if (inflight.has(r.id)) continue
    inflight.add(r.id)
    const car = getState().car, t0 = performance.now()
    call('PUT', r.path).then(() => {
      if (g !== gen) return
      const now = performance.now()
      tele.rtt[r.id] = Math.round(now - t0)
      tele.sent[r.id] = r.path
      doneAt[r.id] = now
      tele.puts++
      for (const row of ROWS) if (row.req === r.id) tele.sentInput[row.label] = row.input(car)
    }, (e: Error) => { if (g === gen) tele.message = `전송 실패: ${e.message}` })
      .finally(() => { if (g === gen) { inflight.delete(r.id); flush() } })
  }
}

async function poll() {
  if (tele.status !== 'ok' || pollBusy) return
  pollBusy = true
  const g = gen
  try {
    const t0 = performance.now()
    const vc = await (await call('GET', '/vehicle/state')).json()
    if (g !== gen) return
    tele.vc = vc
    tele.pollMs = Math.round(performance.now() - t0)
    const now = performance.now()
    for (const row of ROWS) {
      const sent = tele.sentInput[row.label]
      const emu = (tele.emu[row.label] = emuValue(row, tele.vc, lastTrue, now))
      // 보내는 중이거나 이 GET이 시작된 뒤 끝난 PUT은 아직 반영 전일 수 있어 비교하지 않는다
      if (inflight.has(row.req) || (doneAt[row.req] ?? -1) >= t0) { delete mismatchSince[row.label]; continue }
      const differs = sent !== undefined && sent === row.input(getState().car) && emu !== sent
      if (!differs) { delete mismatchSince[row.label]; continue }
      mismatchSince[row.label] ??= now
      if (now - mismatchSince[row.label] > RESYNC_MS) { delete tele.sent[row.req]; delete mismatchSince[row.label] }
    }
  } catch { /* 하트비트가 상태를 바꾼다 */ } finally { if (g === gen) pollBusy = false }
}

export function connect() {
  if (timers.length) return
  tele.status = 'connecting'; tele.message = '연결 중…'; tele.sent = {}; misses = 0
  heartbeat()
  timers = [window.setInterval(heartbeat, 1000), window.setInterval(flush, FLUSH_MS), window.setInterval(poll, 500)]
}
export function disconnect() {
  timers.forEach(clearInterval); timers = []
  ctl.abort(); ctl = new AbortController(); gen++
  inflight.clear(); hbBusy = pollBusy = false
  tele.status = 'off'; tele.message = '연결 안 됨 · 무대만 돈다'
}
export const isConnected = () => timers.length > 0
export const _test = { heartbeat, flush, poll } // npm test 전용
