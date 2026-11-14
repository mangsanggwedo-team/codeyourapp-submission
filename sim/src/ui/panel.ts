// 조작판(심 방식) · 운전 키 안내 · 계기판 · 텔레메트리 표. DOM만 다루고, 값은 act(patch)로 상태 저장소에 넣는다.
import { AREAS, SEATS, type Car, type Patch, type SimState } from '../state.ts'
import { ROWS } from '../bridge/pleos/channels.ts'
import type { Telemetry } from '../bridge/pleos/connector.ts'

const KOR: Record<string, string> = { front_left: '앞왼', front_right: '앞오', rear_left: '뒤왼', rear_right: '뒤오', driver: '운전석', passenger: '조수석' }
const AMBIENT = ['#00e5ff', '#2979ff', '#aa00ff', '#ffffff'] // catalog ambient-light-color 선택지

type Act = (p: Patch) => void
type Bind = (s: SimState) => void

export function buildControls(el: HTMLElement, act: Act, pickGoal: () => void) {
  const binds: Bind[] = []
  const h = (t: string) => { const e = document.createElement('h4'); e.textContent = t; el.append(e) }
  const row = (label?: string) => { const r = document.createElement('div'); r.className = 'row'; if (label) { const l = document.createElement('label'); l.textContent = label; r.append(l) } el.append(r); return r }
  const btn = (r: HTMLElement, text: string, on: (s: SimState) => boolean, click: () => void) => {
    const b = document.createElement('button'); b.textContent = text; b.onclick = click; r.append(b)
    binds.push(s => b.classList.toggle('on', on(s)))
    return b
  }
  const slider = (r: HTMLElement, min: number, max: number, step: number, get: (c: Car) => number, set: (v: number) => void) => {
    const i = document.createElement('input'); i.type = 'range'; i.min = String(min); i.max = String(max); i.step = String(step)
    i.oninput = () => set(+i.value)
    const out = document.createElement('span'); out.style.minWidth = '34px'
    r.append(i, out)
    binds.push(s => { if (document.activeElement !== i) i.value = String(get(s.car)); out.textContent = String(Math.round(get(s.car))) })
  }
  const car = (s: SimState) => s.car

  const sim = document.createElement('div'); const drive = document.createElement('div')
  el.append(sim, drive)

  // ---- 심 방식 ----
  el = sim
  h('기어')
  let r = row(); for (const [k, g] of [['P', 'Park'], ['R', 'Reverse'], ['N', 'Neutral'], ['D', 'Drive']] as const) btn(r, k, s => car(s).gear === g, () => act({ car: { gear: g } }))
  h('자율주행 (차선 따라가기 · 깜빡이 차로 변경 · 신호 정지)')
  r = row()
  btn(r, '자율 켜기', s => car(s).adMode === 'full_autonomous', () => act({ car: { adMode: 'full_autonomous', gear: 'Drive' } }))
  btn(r, '끄기', s => car(s).adMode !== 'full_autonomous', () => act({ car: { adMode: 'not_ready' } }))
  btn(r, '목표 지점 찍기', s => !!s.goal, pickGoal)
  btn(r, '지우기', () => false, () => act({ goal: null }))
  r = row('목표 km/h'); slider(r, 20, 100, 1, c => c.targetSpeedMps * 3.6, v => act({ car: { targetSpeedMps: v / 3.6 } }))
  h('등화')
  r = row(); btn(r, '◀ 왼쪽', s => car(s).signal === 'BlinkLeft', () => act({ car: { signal: 'BlinkLeft' } }))
  btn(r, '끔', s => car(s).signal === 'Off', () => act({ car: { signal: 'Off' } }))
  btn(r, '오른쪽 ▶', s => car(s).signal === 'BlinkRight', () => act({ car: { signal: 'BlinkRight' } }))
  btn(r, '비상등', s => car(s).hazard, () => act({ car: { hazard: !current().car.hazard } }))
  r = row('전조등'); for (const m of ['Off', 'Auto', 'Position', 'LowBeam'] as const) btn(r, m, s => car(s).headlamp === m, () => act({ car: { headlamp: m } }))
  r = row(); btn(r, '상향등', s => car(s).highBeam, () => act({ car: { highBeam: !current().car.highBeam } }))
  h('문 · 트렁크')
  r = row(); for (const a of AREAS) btn(r, `문 ${KOR[a]}`, s => car(s).doors[a], () => act({ car: { doors: { ...current().car.doors, [a]: !current().car.doors[a] } } }))
  r = row(); btn(r, '트렁크', s => car(s).trunk, () => act({ car: { trunk: !current().car.trunk } }))
  btn(r, '프렁크', s => car(s).frunk, () => act({ car: { frunk: !current().car.frunk } }))
  btn(r, '잠금', s => car(s).locked, () => act({ car: { locked: !current().car.locked } }))
  h('창문 (0 닫힘 ~ 100 열림)')
  for (const a of AREAS) { r = row(KOR[a]); slider(r, 0, 100, 1, c => c.windows[a], v => act({ car: { windows: { ...current().car.windows, [a]: v } } })) }
  h('좌석 착좌')
  r = row(); for (const a of SEATS) btn(r, KOR[a], s => car(s).seats[a], () => act({ car: { seats: { ...current().car.seats, [a]: !current().car.seats[a] } } }))
  h('타이어 공기압 kPa · 경고등 (계기판에 표시)')
  for (const a of AREAS) { r = row(KOR[a]); slider(r, 0, 400, 1, c => c.tireKpa[a], v => act({ car: { tireKpa: { ...current().car.tireKpa, [a]: v } } })) }
  r = row('ABS'); for (const m of ['Off', 'On', 'Blink'] as const) btn(r, m, s => car(s).abs === m, () => act({ car: { abs: m } }))
  r = row('TPMS'); for (const m of ['Off', 'On', 'Blink'] as const) btn(r, m, s => car(s).tpms === m, () => act({ car: { tpms: m } }))
  h('실내 무드등')
  r = row(); for (const c of AMBIENT) { const b = btn(r, '●', s => car(s).ambientColor === c, () => act({ car: { ambientColor: c } })); b.style.color = c === '#ffffff' ? '#999' : c }
  r = row('밝기'); slider(r, 0, 100, 1, c => c.ambientPct, v => act({ car: { ambientPct: v } }))
  h('앱 자리')
  r = row(); btn(r, '앱 판단 순간 빛 (보라 고리)', s => s.appGlow, () => act({ appGlow: !current().appGlow }))
  const n = document.createElement('p'); n.className = 'note'; n.textContent = '판단은 앱(:core)이 한다. 이 버튼은 앱 결과가 들어올 자리를 미리 보여 주는 수동 스위치다.'; el.append(n)

  // ---- 운전 방식 ----
  el = drive
  h('운전 방식 · 키보드')
  const k = document.createElement('div'); k.className = 'keys'
  k.innerHTML = '<kbd>↑</kbd> 가속 · <kbd>↓</kbd> 브레이크 · <kbd>Space</kbd> 급제동<br><kbd>←</kbd><kbd>→</kbd> 핸들<br><kbd>Q</kbd> 왼쪽 깜빡이 · <kbd>E</kbd> 오른쪽 깜빡이 · <kbd>H</kbd> 비상등<br><kbd>P</kbd><kbd>R</kbd><kbd>N</kbd><kbd>D</kbd> 기어 (거의 섰을 때)<br>자율 중 <kbd>↓</kbd>/<kbd>Space</kbd> = 자율 해제'
  el.append(k)
  r = row(); for (const [kk, g] of [['P', 'Park'], ['R', 'Reverse'], ['N', 'Neutral'], ['D', 'Drive']] as const) btn(r, kk, s => car(s).gear === g, () => act({ car: { gear: g } }))
  r = row(); btn(r, '자율 켜기', s => car(s).adMode === 'full_autonomous', () => act({ car: { adMode: 'full_autonomous', gear: 'Drive' } }))
  btn(r, '끄기', s => car(s).adMode !== 'full_autonomous', () => act({ car: { adMode: 'not_ready' } }))
  const n2 = document.createElement('p'); n2.className = 'note'; n2.textContent = '안전: 주행 중 앱 화면은 Pleos가 가린다. 주행 순간의 경험은 음성이 맡는다 (DESIGN.md).'; el.append(n2)

  let current: () => SimState = () => { throw new Error('not bound') }
  return {
    bindCurrent(f: () => SimState) { current = f },
    refresh(s: SimState) {
      sim.style.display = s.mode === 'sim' ? '' : 'none'
      drive.style.display = s.mode === 'drive' ? '' : 'none'
      binds.forEach(b => b(s))
    },
  }
}

export function renderCluster(el: HTMLElement, c: Car, t: number) {
  const blink = Math.floor(t * 3) % 2 === 0
  const L = (c.hazard || c.signal === 'BlinkLeft') && blink, R = (c.hazard || c.signal === 'BlinkRight') && blink
  const tt = (name: string, st: string, cls: string) => `<span class="tt ${st === 'On' || (st === 'Blink' && blink) ? cls : ''}">${name}</span>`
  const doorOpen = AREAS.some(a => c.doors[a]) || c.trunk
  const tire = (a: (typeof AREAS)[number]) => `<span class="${c.tireKpa[a] < 200 ? 'low' : ''}">${KOR[a]} ${Math.round(c.tireKpa[a])}</span>`
  el.innerHTML = `<span class="arrow ${L ? 'on' : ''}">◀</span>
    <div><div class="spd">${Math.round(c.speedKph)}</div><div class="unit">km/h</div></div>
    <div class="gear">${(['P', 'R', 'N', 'D'] as const).map(g => `<span class="${c.gear[0] === g ? 'on' : ''}">${g}</span>`).join('')}</div>
    <div>${tt('ABS', c.abs, 'amber')} ${tt('TPMS', c.tpms, 'amber')} ${tt('문', doorOpen ? 'On' : 'Off', 'red')} ${tt('비상', c.hazard ? 'Blink' : 'Off', 'red')}</div>
    <div class="tires">${tire('front_left')}${tire('front_right')}${tire('rear_left')}${tire('rear_right')}</div>
    <div class="ad ${c.adMode === 'full_autonomous' ? 'on' : ''}">${c.adMode === 'full_autonomous' ? `자율 ${Math.round(c.targetSpeedMps * 3.6)}` : '수동'}</div>
    <span class="arrow ${R ? 'on' : ''}">▶</span>`
}

export function renderTelemetry(el: HTMLElement, c: Car, tele: Pick<Telemetry, 'status' | 'vc' | 'sentInput' | 'rtt' | 'pollMs' | 'puts' | 'emu'>) {
  const live = tele.status === 'ok' && tele.vc
  const rows = ROWS.map(r => {
    const input = r.input(c)
    const sent = tele.sentInput[r.label] ?? '-'
    const emu = live ? tele.emu[r.label] ?? r.emu(tele.vc) : '-'
    const cls = !live ? '' : emu === input ? 'good' : 'bad'
    const ms = tele.rtt[r.req]
    return `<tr class="${cls}"><td>${r.label}</td><td>${input}</td><td>${sent}</td><td class="emu">${emu}</td><td class="ms">${ms !== undefined ? ms : ''}</td></tr>`
  }).join('')
  const ok = live ? ROWS.filter(r => (tele.emu[r.label] ?? r.emu(tele.vc)) === r.input(c)).length : 0
  el.innerHTML = `<div class="sum">${live ? `일치 ${ok}/${ROWS.length} · 읽기 ${tele.pollMs}ms · 보낸 PUT ${tele.puts}회` : '에뮬레이터 연결 전: 넣은 값만 보인다'}</div>
    <table><thead><tr><th>항목</th><th>넣은 값</th><th>보낸 값</th><th>에뮬레이터</th><th>ms</th></tr></thead><tbody>${rows}</tbody></table>`
}
