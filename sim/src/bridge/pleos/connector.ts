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
let timers: number[] = []
let busy = false, hbBusy = false, pollBusy = false, misses = 0

async function call(method: string, path: string) {
  const r = await fetch(BASE + path, { method, signal: AbortSignal.timeout(4000) })
  if (!r.ok) throw new Error(`${method} ${path.split('?')[0]} ${r.status}`)
  return r
}

// 세션 하트비트가 있어야 콘솔 브리지가 준비된다(bridge_ready). 서버 타임아웃 3초, 우리는 1초마다.
async function heartbeat() {
  if (hbBusy) return
  hbBusy = true
  try {
    await call('POST', `/browser/session?client=${CLIENT}`)
    misses = 0
    if (tele.status !== 'ok') { tele.status = 'ok'; tele.message = '연결됨 · 값이 바뀔 때만 보낸다'; tele.sent = {} }
  } catch {
    if (++misses >= 3) { // 한 번 늦은 것으로 끊지 않는다 (맥 부하가 높으면 응답이 수 초 걸림)
      tele.status = 'error'
      tele.message = '연결 실패: 에뮬레이터 실행과 adb forward tcp:8088 tcp:8088 확인 · 무대는 계속 돈다'
    }
  } finally { hbBusy = false }
}

async function flush() {
  if (tele.status !== 'ok' || busy) return
  busy = true
  const car = getState().car
  try {
    // 바뀐 요청은 경로가 서로 달라 동시에 보낸다 (차례로 보내면 맥 부하 때 첫 동기화가 수십 초 걸림)
    const results = await Promise.allSettled(changed(car, tele.sent).map(async r => {
      const t0 = performance.now()
      await call('PUT', r.path)
      tele.rtt[r.id] = Math.round(performance.now() - t0)
      tele.sent[r.id] = r.path
      tele.puts++
      for (const row of ROWS) if (row.req === r.id) tele.sentInput[row.label] = row.input(car)
    }))
    const fail = results.find(x => x.status === 'rejected') as PromiseRejectedResult | undefined
    if (fail) tele.message = `전송 실패: ${(fail.reason as Error).message}`
  } finally { busy = false }
}

async function poll() {
  if (tele.status !== 'ok' || pollBusy) return
  pollBusy = true
  try {
    const t0 = performance.now()
    tele.vc = await (await call('GET', '/vehicle/state')).json()
    tele.pollMs = Math.round(performance.now() - t0)
    const now = performance.now()
    for (const row of ROWS) {
      const sent = tele.sentInput[row.label]
      const emu = (tele.emu[row.label] = emuValue(row, tele.vc, lastTrue, now))
      const differs = sent !== undefined && sent === row.input(getState().car) && emu !== sent
      if (!differs) { delete mismatchSince[row.label]; continue }
      mismatchSince[row.label] ??= now
      if (now - mismatchSince[row.label] > RESYNC_MS) { delete tele.sent[row.req]; delete mismatchSince[row.label] }
    }
  } catch { /* 하트비트가 상태를 바꾼다 */ } finally { pollBusy = false }
}

export function connect() {
  if (timers.length) return
  tele.status = 'connecting'; tele.message = '연결 중…'; tele.sent = {}; misses = 0
  heartbeat()
  timers = [window.setInterval(heartbeat, 1000), window.setInterval(flush, FLUSH_MS), window.setInterval(poll, 500)]
}
export function disconnect() {
  timers.forEach(clearInterval); timers = []
  tele.status = 'off'; tele.message = '연결 안 됨 · 무대만 돈다'
}
export const isConnected = () => timers.length > 0
