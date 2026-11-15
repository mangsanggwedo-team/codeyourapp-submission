// 골방 여정 시뮬레이션 자막형 시연영상 녹화 (Playwright + 시스템 Chrome).
// 사용: (journey 폴더에서) python3 -m http.server 8011 &  →  node demo/record_demo.mjs  →  ffmpeg (README)
import { chromium } from "playwright";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "out");
const BASE = "http://127.0.0.1:8011/index.html";
const W = 1600, H = 900, FONTS = '"Pretendard","Apple SD Gothic Neo",sans-serif';
fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) if (f.endsWith(".webm")) fs.unlinkSync(path.join(OUT, f));

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: W, height: H } } });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", e => errors.push(String(e)));
const wait = ms => page.waitForTimeout(ms);

const overlay = () => page.evaluate(fonts => {
  if (document.getElementById("dcap")) return;
  const s = document.createElement("style");
  s.textContent = `#dcap{position:fixed;left:0;right:0;top:18px;z-index:99999;display:flex;justify-content:center;pointer-events:none;font-family:${fonts}}
  #dcap .c{max-width:56%;background:rgba(14,13,18,.88);color:#EEEAF8;font-size:22px;font-weight:600;line-height:1.5;padding:12px 24px;border-radius:12px;border:1px solid rgba(143,115,255,.45);text-align:center;opacity:0;transition:opacity .35s}
  #dcap .c.on{opacity:1}#dcap .e{color:#B9A6FF;font-size:14px;font-weight:700;margin-right:10px;letter-spacing:.3px}
  #dcard{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(1100px 650px at 50% 38%,#1E1A2C,#0B0A0F 75%);color:#EEEAF8;font-family:${fonts};opacity:0;transition:opacity .6s;pointer-events:none}
  #dcard.on{opacity:1}#dcard .l{font-size:16px;letter-spacing:4px;color:#B9A6FF;font-weight:700}#dcard h1{font-size:60px;margin:0;font-weight:800;letter-spacing:-1px}
  #dcard p{font-size:24px;color:#B8B2C8;margin:0;max-width:66%;text-align:center;line-height:1.6}#dcard .t{font-size:15px;color:#E0B04A;border:1px solid rgba(201,133,0,.5);padding:6px 16px;border-radius:999px}`;
  document.head.appendChild(s);
  const c = document.createElement("div"); c.id = "dcap"; c.innerHTML = '<div class="c"></div>'; document.body.appendChild(c);
  const k = document.createElement("div"); k.id = "dcard"; k.innerHTML = '<div class="l"></div><h1></h1><p></p><div class="t"></div>'; document.body.appendChild(k);
}, FONTS);
const cap = (e, t) => page.evaluate(([e, t]) => { const el = document.querySelector("#dcap .c"); el.innerHTML = (e ? `<span class="e">${e}</span>` : "") + t; el.classList.add("on"); }, [e, t]);
const capOff = async () => { await page.evaluate(() => document.querySelector("#dcap .c").classList.remove("on")); await wait(400); };
const card = async (l, h, p, t, hold) => { await page.evaluate(([l, h, p, t]) => { const k = document.getElementById("dcard"); k.querySelector(".l").textContent = l; k.querySelector("h1").textContent = h; k.querySelector("p").innerHTML = p; const tg = k.querySelector(".t"); tg.textContent = t; tg.style.display = t ? "" : "none"; k.classList.add("on"); }, [l, h, p, t]); await wait(hold); };
const cardOff = async () => { await page.evaluate(() => document.getElementById("dcard").classList.remove("on")); await wait(700); };
const go = async (q) => { await page.goto(BASE + q, { waitUntil: "networkidle" }); await wait(600); await overlay(); await page.addStyleTag({ content: "#ctrl,#hint{visibility:hidden}" }); };
// 시뮬레이션 전역(T, speed, playing)을 직접 움직인다. 시뮬레이터 T는 첫 키프레임(-60초)을 0으로 옮기므로 사양 시각 + 60
const runTo = async (specT, spd) => {
  const target = specT + 60;
  await page.evaluate(s => { speed = s; playing = true; buildCtrl(); }, spd);
  await page.waitForFunction(t => T >= t, target, { timeout: 120000, polling: 50 });
  await page.evaluate(() => { playing = false; buildCtrl(); });
};
const setT = (t) => page.evaluate(t => { T = t; }, t);

// ── 스토리보드 (시나리오 A: 평일 21:40 지하주차장, 40분 운전 뒤 기도)
await go("?s=A&t=0&paused=1");
await card("TEAM 망상궤도 · PLEOS CODE YOUR APP", "골방 (가제)", "주차한 차가 잠깐 골방이 된다.<br>집에 들어가기 전, 휴대폰 대신 기도와 고요한 머묾.", "P단 전용 · 기기 안에서만 · 버튼 없이 닫힘", 5200);
await cardOff();

await cap("시나리오 A", "평일 21:40, 아파트 지하주차장. 40분 운전을 마치고 P단에 둔다."); await runTo(0, 5); await wait(800);
await cap("준비", "차가 먼저 묻는다. 사용자는 아무것도 설정하지 않는다."); await runTo(14, 4); await wait(1200);
await cap("문턱", "문 잠금, 창문, 등받이 세움, 조명. 이미 잠긴 문은 다시 잠그지 않는다."); await runTo(30, 3); await wait(1500);
await cap("숨", "앰비언트가 들숨에 밝아지고 날숨에 어두워진다. 세 번."); await runTo(84, 5); await wait(800);
await cap("머묾", "머무는 동안 차는 말하지 않는다. 마이크도 쓰지 않는다."); await runTo(420, 60); await wait(600);
await cap("머묾", "왼쪽 위: 시간과 차량 신호로 '마칠 준비' 확률을 계속 추정한다."); await runTo(820, 60); await wait(800);
await cap("돌아옴", "'마치겠습니까?' 버튼 대신, 준비가 보이면 빛이 먼저 오른다."); await runTo(894, 5); await wait(800);
await cap("돌아옴", "확률 0.5 빛, 0.7 소리 줄임, 0.85 한 문장으로 닫는다."); await runTo(945, 5); await wait(1500);
await cap("출발 준비", "모든 레버를 시작 전 값으로 되돌린다. 다시 운전자다."); await runTo(1000, 6); await wait(1600);
await capOff();

// ── 신호 넣기 시연: 같은 머묾 구간에서 사용자가 몸을 움직이면 추정이 바뀐다
await go("?s=A&t=660&paused=1");
await cap("신호 넣기", "머묾 10분째. 안전벨트를 매면 '곧 떠난다'는 신호로 확률이 오른다."); await wait(2500);
await page.locator("#sig button", { hasText: "벨트 맴" }).first().click().catch(() => {}); await runTo(640, 5); await wait(1500);
await cap("신호 넣기", "등받이를 다시 젖히면 '더 머문다'로 읽고 확률을 낮춘다."); await wait(1500);
await page.locator("#sig button", { hasText: "↓" }).first().click().catch(() => {}); await runTo(680, 5); await wait(1800);
await capOff();

// ── 시나리오 C: 예외
await go("?s=C&t=590&paused=1");
await cap("시나리오 C", "예외: 머무는 중 기어를 P에서 빼면 의례보다 안전이 먼저다."); await runTo(560, 3); await wait(800);
await cap("안전", "즉시 멈추고, 바꿨던 레버를 모두 원래대로 복원한다."); await runTo(600, 4); await wait(1500);
await capOff();

await card("골방 (가제)", "차가 먼저 알아채고, 조용히 돌려놓는다", "Pleos Vehicle SDK로 문, 창문, 좌석, 공기, 빛을 한 흐름으로 바꾸고 되돌린다.<br>기도와 감정 기록은 차 밖으로 나가지 않는다.", "시뮬레이션은 설계값 재생이며 실차 실측이 아님", 6000);

await ctx.close(); await browser.close();
const webm = fs.readdirSync(OUT).find(f => f.endsWith(".webm"));
console.log("WEBM:" + webm); if (errors.length) console.log("PAGE ERRORS:", errors.join(" | "));
