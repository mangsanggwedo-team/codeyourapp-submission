// 연결기 순수 로직 자체 검사: npm test
import assert from 'node:assert/strict'
import { initialState } from './state.ts'
import { changed, emuValue, REQS, ROWS } from './bridge/pleos/channels.ts'

const c = initialState().car
const all = changed(c, {})
assert.equal(all.length, REQS.length, '처음엔 모든 요청을 보낸다')
const sent = Object.fromEntries(all.map(r => [r.id, r.path]))
assert.equal(changed(c, sent).length, 0, '값이 같으면 보내지 않는다')

const c2 = { ...c, doors: { ...c.doors, front_left: true }, windows: { ...c.windows, front_right: 40 } }
const diff = changed(c2, sent)
assert.deepEqual(diff.map(d => d.id), ['body'], '문·창문은 body 한 번으로 묶인다')
assert.match(diff[0].path, /door_fl=true/)
assert.match(diff[0].path, /window_fr=40/)
assert.match(diff[0].path, /ambient_color=%23ffffff/, '# 는 인코딩한다')

assert.equal(changed({ ...c, steeringDeg: 2 }, sent).length, 0, '조향 5도 미만 변화는 보내지 않는다')
assert.match(changed({ ...c, hazard: true }, sent)[0].path, /feature=hazard&value=true/, '비상등이 켜지면 비상등만')
assert.match(changed({ ...c, signal: 'BlinkLeft' }, sent)[0].path, /turn-signal\?mode=BlinkLeft/)
assert.match(changed({ ...c, tireKpa: { ...c.tireKpa, rear_right: 150 } }, sent)[0].path, /area=1179727&pressure_kpa=150/)

const vc = { gear: { actual: { value: 'Park' } }, body: { doors: { front_left: true } }, tire_pressure: { pressure_kpa: { 1179727: 150.0 } } }
assert.equal(ROWS.find(r => r.label === '기어')!.emu(vc), 'Park')
assert.equal(ROWS.find(r => r.label === '문 앞왼')!.emu(vc), 'true')
assert.equal(ROWS.find(r => r.label === '공기압 뒤오 kPa')!.emu(vc), '150')
assert.equal(ROWS.find(r => r.label === '자율 모드')!.emu(vc), '-', '없는 값은 -')
const haz = ROWS.find(r => r.label === '비상등')!, hold: Record<string, number> = {}
assert.equal(emuValue(haz, { lights: { hazard_on: true } }, hold, 0), 'true')
assert.equal(emuValue(haz, { lights: { hazard_on: false } }, hold, 500), 'true', '점멸 꺼진 순간도 켜짐')
assert.equal(emuValue(haz, { lights: { hazard_on: false } }, hold, 2000), 'false', '1.5초 넘게 꺼져 있으면 꺼짐')
console.info(`selftest ok: ${REQS.length} 요청, ${ROWS.length} 행`)

// ---- 연결기 동작 (fetch 가짜, 시계 가짜) ----
const { setState, getState } = await import('./state.ts')
const { tele, disconnect, _test } = await import('./bridge/pleos/connector.ts')
type Pending = { method: string; path: string; signal: AbortSignal; done: (body?: unknown) => void }
const pend: Pending[] = []
let now = 0
performance.now = () => now
globalThis.fetch = ((url: string, init: RequestInit) => new Promise(res => pend.push({
  method: init.method!, path: url.replace(/^https?:\/\/[^/]+/, ''), signal: init.signal!,
  done: body => res({ ok: true, status: 200, json: async () => body } as Response),
}))) as typeof fetch
const tick = () => new Promise(r => setTimeout(r, 0))
const take = (m: string) => { const i = pend.findIndex(p => p.method === m); return i < 0 ? undefined : pend.splice(i, 1)[0] }
async function drainPuts() { let p, max = 0; while ((p = take('PUT'))) { max = Math.max(max, pend.filter(x => x.method === 'PUT').length + 1); p.done(); await tick() } return max }

_test.heartbeat(); take('POST')!.done(); await tick()
assert.equal(tele.status, 'ok')
// 1) 동시 PUT 상한 2, 보내는 중 바뀐 값은 최신 값으로 한 번 더
_test.flush()
assert.equal(pend.filter(p => p.method === 'PUT').length, 2, '첫 동기화도 동시 PUT은 2개까지')
setState({ car: { gear: 'Drive' } }) // gear PUT(Park)이 보내는 중일 때 바뀜
const maxConc = await drainPuts()
assert.ok(maxConc <= 2, `동시 PUT ${maxConc}`)
assert.equal(changed(getState().car, tele.sent).length, 0, '다 보낸 뒤 남은 차이 없음')
assert.equal(tele.puts, REQS.length + 1, '바뀐 기어만 한 번 더 보냄')
assert.match(tele.sent.gear, /gear=Drive/, '항목별 최신 값')

// 2) PUT이 끝나기 전에 시작한 GET은 그 항목을 비교하지 않는다 (낡은 GET으로 재전송 안 함)
const stale = { gear: { actual: { value: 'Drive' } } }
setState({ car: { gear: 'Neutral' } })
now = 1000; _test.poll() // GET A 시작 (PUT 전)
now = 1100; _test.flush(); take('PUT')!.done(); await tick() // gear=Neutral 완료
now = 3000; take('GET')!.done(stale); await tick() // GET A: 옛 값
now = 3000; _test.poll(); now = 5200; take('GET')!.done(stale); await tick() // GET B도 늦게 옛 값 (반영 지연)
assert.match(tele.sent.gear ?? '', /gear=Neutral/, 'PUT 전에 시작한 GET 결과로 재전송하지 않는다')
now = 5300; _test.poll(); now = 7400; take('GET')!.done(stale); await tick()
assert.equal(tele.sent.gear, undefined, 'PUT 뒤 2초 넘게 다르면 다시 보낸다')

// 5) 끊기 뒤 돌아온 응답은 새 연결 기록을 덮지 않는다
_test.flush(); _test.heartbeat()
const hb = take('POST')!, put = take('PUT')!
disconnect()
assert.ok(hb.signal.aborted && put.signal.aborted, '끊으면 진행 중 요청 취소')
const putsBefore = tele.puts
hb.done(); put.done(); await tick()
assert.equal(tele.status, 'off', '끊은 뒤 늦은 하트비트가 연결됨으로 되돌리지 않는다')
assert.equal(tele.puts, putsBefore, '끊은 뒤 늦은 PUT은 기록하지 않는다')

// 4) 깜빡이 차로 변경이 목표 지점 차로보다 우선
const { autopilot } = await import('./drive.ts')
const { LANES } = await import('./scene/theme.ts')
const west = { x: 0, z: LANES.west[1], yaw: Math.PI }
const goal = { x: -30, z: LANES.west[1] }
assert.equal(autopilot({ ...c, signal: 'Off' }, west, goal, 0).laneZ, LANES.west[1])
assert.equal(autopilot({ ...c, signal: 'BlinkLeft' }, west, goal, 0).laneZ, LANES.west[0], '목표가 있어도 왼쪽 깜빡이면 중앙선 쪽 차로')
console.info('selftest ok: 동시 PUT 상한·최신 값·낡은 GET·끊기 세대·깜빡이 우선')
