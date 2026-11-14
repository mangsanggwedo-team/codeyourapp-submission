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
