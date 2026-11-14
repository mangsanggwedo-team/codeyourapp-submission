// 자막형 데모 영상 녹화 템플릿 (Playwright → webm).  무음, 화면에 캡션을 새김.
// 사용법:
//   1) 이 파일을 프로젝트로 복사 (예: scripts/record_demo.mjs)
//   2) CONFIG + storyboard() 두 곳만 앱에 맞게 수정
//   3) 정적/개발 서버 기동 후:  node scripts/record_demo.mjs
//   4) ffmpeg로 mp4 변환 (SKILL.md 참조)
//
// 핵심 원리 (수정해도 유지할 것):
//   · 캡션/카드 오버레이는 document.body 에 부착 → SPA가 부분 렌더해도 생존
//     (단, 전체 페이지 reload(goto) 후에는 installOverlay() 재호출 필요)
//   · deviceScaleFactor:2 로 또렷하게 렌더, recordVideo.size 로 영상 해상도 고정
//   · 한국어 폰트 명시 → tofu(□) 방지. 검증 단계에서 프레임 추출로 반드시 육안 확인.
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// ────────────────────────────────── CONFIG (앱에 맞게 수정)
const CONFIG = {
  base: "http://127.0.0.1:8011",                 // 개발/정적 서버 URL
  out: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demo-video"), // 산출 폴더
  width: 1440, height: 810,                       // 16:9 권장. 텍스트 밀집 UI면 가독성 우선
  read: 3800,                                      // 한 캡션 라인 표준 노출(ms). 3.5~4s 권장
  fonts: '"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif',
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: CONFIG.width, height: CONFIG.height },
    deviceScaleFactor: 2,
    recordVideo: { dir: CONFIG.out, size: { width: CONFIG.width, height: CONFIG.height } },
  });
  const page = await context.newPage();

  // ── 오버레이 주입 (캡션 + 풀스크린 카드)
  const installOverlay = async () => {
    await page.evaluate((fonts) => {
      if (document.getElementById("demo-cap")) return;
      const s = document.createElement("style");
      s.textContent = `
        #demo-cap{position:fixed;left:0;right:0;bottom:34px;z-index:2147483646;display:flex;justify-content:center;pointer-events:none;font-family:${fonts};}
        #demo-cap .cap{max-width:78%;background:rgba(8,14,26,.86);color:#eef3fb;font-size:23px;font-weight:600;line-height:1.5;letter-spacing:-.2px;padding:14px 26px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.45);border:1px solid rgba(120,160,235,.35);text-align:center;opacity:0;transition:opacity .35s ease;}
        #demo-cap .cap.show{opacity:1;}
        #demo-cap .eb{color:#7fb0ff;font-weight:700;font-size:15px;letter-spacing:.4px;margin-right:10px;}
        #demo-card{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(1200px 700px at 50% 35%,#16203a,#070b15 75%);color:#eef3fb;font-family:${fonts};opacity:0;transition:opacity .5s ease;pointer-events:none;}
        #demo-card.show{opacity:1;}
        #demo-card .logo{font-size:20px;letter-spacing:3px;color:#7fb0ff;font-weight:700;}
        #demo-card h1{font-size:52px;font-weight:800;margin:0;letter-spacing:-1px;text-align:center;}
        #demo-card p{font-size:24px;color:#aebfdc;margin:0;max-width:70%;text-align:center;line-height:1.55;font-weight:500;}
        #demo-card .tag{margin-top:8px;font-size:16px;color:#88f0c4;border:1px solid rgba(136,240,196,.4);padding:7px 16px;border-radius:999px;}`;
      document.head.appendChild(s);
      const cap = document.createElement("div");
      cap.id = "demo-cap"; cap.innerHTML = `<div class="cap"></div>`;
      document.body.appendChild(cap);
      const card = document.createElement("div");
      card.id = "demo-card";
      card.innerHTML = `<div class="logo"></div><h1></h1><p></p><div class="tag" style="display:none"></div>`;
      document.body.appendChild(card);
    }, CONFIG.fonts);
  };

  // ── 헬퍼 (storyboard 에서 사용)
  const cap = async (eyebrow, text, hold = CONFIG.read) => {
    await page.evaluate(({ eb, t }) => {
      const el = document.querySelector("#demo-cap .cap"); if (!el) return;
      el.innerHTML = (eb ? `<span class="eb">${eb}</span>` : "") + t;
      el.classList.add("show");
    }, { eb: eyebrow, t: text });
    await page.waitForTimeout(hold);
  };
  const capHide = async () => {
    await page.evaluate(() => document.querySelector("#demo-cap .cap")?.classList.remove("show"));
    await page.waitForTimeout(350);
  };
  const card = async (logo, title, sub, tag, hold = 4600) => {
    await page.evaluate(({ logo, title, sub, tag }) => {
      const c = document.getElementById("demo-card");
      c.querySelector(".logo").textContent = logo || "";
      c.querySelector("h1").textContent = title;
      c.querySelector("p").textContent = sub;
      const tg = c.querySelector(".tag");
      if (tag) { tg.style.display = "inline-block"; tg.textContent = tag; } else tg.style.display = "none";
      c.classList.add("show");
    }, { logo, title, sub, tag });
    await page.waitForTimeout(hold);
  };
  const cardHide = async () => {
    await page.evaluate(() => document.getElementById("demo-card")?.classList.remove("show"));
    await page.waitForTimeout(600);
  };
  const go = async (url) => {
    await page.goto(CONFIG.base + url, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await installOverlay();           // reload 후 오버레이 재주입
  };
  const click = async (selector, wait = 900) => {
    await page.click(selector).catch(() => {});
    await page.waitForTimeout(wait);
  };
  const scrollTo = async (selector, pause = 1400) => {
    await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "center" }), selector);
    await page.waitForTimeout(pause);
  };
  const evalJs = async (fn, arg, wait = 800) => { await page.evaluate(fn, arg); await page.waitForTimeout(wait); };

  // ══════════════════════════════════ EDIT THIS: 스토리보드 ══════════════════════════════════
  // 좋은 데모의 조건:
  //   1) 표지(card) → 서비스 소개 → 핵심 시나리오들 → 마무리(card)
  //   2) "동작 과정"을 보여줄 것 — 스크롤만 하지 말고 실제 버튼을 click() 해 상태 변화를 노출
  //   3) 차별점/핵심 가치가 화면에 명시적으로 보이게
  //   4) 캡션은 3.5~4s 유지, 전환은 부드럽게. 5분/100MB 한도 안에서 여유롭게.
  const storyboard = async () => {
    await go("/");
    await card("🛡 MY PRODUCT", "제품명", "한 줄 정의 — 무엇을, 누구를 위해, 어떻게.", "대회명/맥락", 4600);
    await cardHide();

    await cap("서비스 소개", "핵심 가치 문장 1.", 4000);
    await cap("서비스 소개", "핵심 가치 문장 2.", 4000);
    await capHide();

    await cap("핵심 시나리오 ①", "시나리오 설명.", 4200);
    await click("[data-some-button]");                 // ← 실제 동작 노출
    await scrollTo(".some-key-panel");
    await cap("주요 기능 동작", "지금 무슨 일이 일어나는지 설명.", 4400);
    await capHide();

    await card("", "마무리 메시지", "한 줄 요약 — 왜 이 제품이 중요한가.", "지표 14·25·3·19", 5000);
    await cardHide();
  };
  // ════════════════════════════════════════════════════════════════════════════════════════

  await installOverlay();
  await storyboard();

  await page.waitForTimeout(500);
  await context.close();             // video flush (필수)
  await browser.close();
  const webm = fs.readdirSync(CONFIG.out).filter((f) => f.endsWith(".webm"))[0];
  console.log("WEBM:" + (webm || "NONE"));
};

main().catch((e) => { console.error(e); process.exit(1); });
