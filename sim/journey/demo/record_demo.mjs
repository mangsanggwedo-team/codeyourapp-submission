// 룸19 여정 시뮬레이션 자막형 시연영상 녹화 (Playwright + 시스템 Chrome).
// 사용: (journey 폴더에서) python3 -m http.server 8011 &  →  node demo/record_demo.mjs  →  ffmpeg (README)
import { chromium } from "playwright";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "out");
const BASE = "http://127.0.0.1:8011/index.html";
const W = 1600, H = 900, FONTS = '"Noto Serif KR","AppleMyungjo","Nanum Myeongjo",serif';
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
  #dcap .c{max-width:56%;background:rgba(9,8,11,.92);color:#EEEAF8;font-size:23px;font-weight:500;line-height:1.5;padding:12px 26px;border-radius:10px;border:1px solid rgba(255,255,255,.12);text-align:center;opacity:0;transition:opacity .35s}
  #dcap .c.on{opacity:1}#dcap .e{color:#B9A6FF;font-size:14px;font-weight:700;margin-right:10px;letter-spacing:.3px}
  #dcard{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#09080B;color:#EEEAF8;font-family:${fonts};opacity:0;transition:opacity .6s;pointer-events:none}
  #dcard.on{opacity:1}#dcard .l{font-size:16px;letter-spacing:4px;color:#B9A6FF;font-weight:700}#dcard h1{font-size:72px;margin:0;font-weight:600;letter-spacing:-.5px}
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

// ── 스토리보드 v1 (2:30 이내): 낮 회사 주차장 → 차 안 화면(에뮬레이터 실녹화) → 밤 지하주차장 여섯 단계 → 끼어듦
// 에뮬레이터 클립은 out/emu.mp4 (adb screenrecord). 없으면 그 컷만 건너뛴다.
const emu = async (src, text, ms) => {
  await page.evaluate(([src, text]) => { const d = document.createElement("div"); d.id = "demu";
    d.style.cssText = "position:fixed;inset:0;z-index:100001;background:#09080B;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;opacity:0;transition:opacity .6s";
    d.innerHTML = `<video src="${src}" muted playsinline style="width:1180px;border-radius:18px;border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 90px rgba(0,0,0,.6)"></video><div style="font-family:${getComputedStyle(document.querySelector("#dcap")).fontFamily};color:#EEEAF8;font-size:24px;line-height:1.6;text-align:center">${text}</div>`;
    document.body.appendChild(d); requestAnimationFrame(() => d.style.opacity = 1); return d.querySelector("video").play(); }, [src, text]);
  await wait(ms); await page.evaluate(() => { document.getElementById("demu").style.opacity = 0; }); await wait(700); await page.evaluate(() => document.getElementById("demu").remove());
};

await go("?s=B&t=50&paused=1");
await card("TEAM 망상궤도 · PLEOS CODE YOUR APP", "룸19", "주차한 차가 잠깐, 기도하는 방이 된다.", "P단에서만 · 기기 안에서만 · 버튼 없이 닫힘", 4500);
await cardOff();

await cap("낮", "점심, 회사 주차장. 기도 시간에 갈 방이 없다. 차를 세운다."); await runTo(6, 4); await wait(600);
await cap("낮", "차가 먼저 묻는다. 문을 잠그고, 숨을 고르고, 머문다."); await runTo(60, 6); await wait(800);
await capOff();
await go("?s=B&t=512&paused=1");
await cap("낮", "마칠 때가 보이면 빛이 먼저 오른다. 자리는 처음대로 돌아온다."); await runTo(500, 5); await wait(1200);
await capOff();

if (fs.existsSync(path.join(OUT, "emu.mp4"))) await emu("demo/out/emu.mp4", "차 안 화면. Pleos Connect 에뮬레이터 실녹화: 앱이 차량의 주차 상태를 읽는다.<br><span style='font-size:17px;color:#B8B2C8'>여섯 단계 화면의 에뮬레이터 반영은 예정</span>", 9000);

await go("?s=A&t=50&paused=1");
await cap("밤", "평일 21:40, 아파트 지하주차장. 집에 올라가기 전, P단에 둔다."); await runTo(7, 4); await wait(600);
await cap("1 준비", "차가 먼저 묻는다. 사용자는 아무것도 설정하지 않는다."); await runTo(14, 3); await wait(1000);
await cap("2 문턱", "문 잠금, 창문, 조명. 등받이는 조금만 뒤로 기댄다. 눕히지 않는다."); await runTo(30, 3); await wait(1200);
await cap("3 숨", "빛이 들숨에 밝아지고 날숨에 어두워진다."); await runTo(84, 6); await wait(600);
await cap("4 머묾", "머무는 동안 차는 말하지 않는다. 마이크도 쓰지 않는다."); await runTo(820, 90); await wait(600);
await cap("5 돌아옴", "'마치겠습니까?' 버튼이 없다. 마칠 준비가 보이면 빛이 먼저 오른다."); await runTo(894, 6); await wait(600);
await cap("5 돌아옴", "빛, 그다음 소리, 마지막에 한 문장. 그렇게 닫는다."); await runTo(945, 5); await wait(1200);
await cap("6 출발 준비", "바꿨던 것을 시작 전 값으로 되돌린다. 다시 운전자다."); await runTo(1000, 6); await wait(1400);
await capOff();

// ── 끼어듦: 전화가 오면 멈춰 두었다가 이어간다
await go("?s=C&t=262&paused=1");
await cap("끼어듦", "머무는 중에 전화가 온다. 끊지 않고 멈춰 둔다."); await runTo(215, 3); await wait(1200);
await cap("끼어듦", "통화가 끝나면 그 자리에서 다시 이어간다."); await runTo(290, 9); await wait(1500);
await capOff();

await card("룸19", "차가 먼저 알아채고, 조용히 돌려놓는다", "Pleos Vehicle SDK로 문, 창문, 좌석, 공기, 빛을 한 흐름으로 바꾸고 되돌린다.<br>기도는 차 밖으로 나가지 않는다.", "시뮬레이션은 설계값 재생이며 실차 실측이 아님 · 좌석과 조명 제어는 실차 검증 예정", 6000);

await ctx.close(); await browser.close();
const webm = fs.readdirSync(OUT).find(f => f.endsWith(".webm"));
console.log("WEBM:" + webm); if (errors.length) console.log("PAGE ERRORS:", errors.join(" | "));
