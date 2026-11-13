---
name: web-demo-video
description: 웹앱/웹 제품의 자막형 데모(시연) 영상을 코드로 제작한다. Playwright로 화면을 실제 조작·녹화 → ffmpeg로 mp4 변환. 사용자가 "시연영상", "데모 영상", "demo video", "제품 영상", "워크스루 영상", "스크린 레코딩", "screen recording", "walkthrough" 등을 언급하거나 웹 제품 시연·발표·공모전 제출 영상이 필요하면 사용. 무음+한글 자막으로 자체 완결(목소리 더빙 불필요). 실제 환경(JB Fin:AI Challenge 시연영상)에서 검증된 워크플로.
---

# 웹 데모(시연) 영상 제작

코드로 재현 가능한 **자막형 무음 데모 영상**을 만든다. Playwright가 앱을 실제로 클릭·스크롤하며 녹화하고, 화면에 한글 캡션을 새겨 설명한다. 목소리 없이도 자체 완결되므로 그대로 제출 가능하다.

**파이프라인:** 정적/개발 서버 → Playwright `recordVideo`(webm) → ffmpeg(mp4) → **프레임 추출 검증**.

## 0. 사전 점검 (없으면 설치 안내)
```bash
which ffmpeg                                   # 변환에 필수
node -e "require('playwright')" && echo OK     # playwright (chromium 포함)
npx playwright install chromium                # chromium 없으면
```
- 영상 녹화는 **full chromium** 필요(headless_shell 불가). playwright가 알아서 찾는다.
- 한국어 자막은 시스템 한글 폰트 필요(macOS: Apple SD Gothic Neo 기본 탑재).

## 1. 템플릿 복사 → 스토리보드 작성
이 스킬의 `record_demo.template.mjs`를 프로젝트로 복사한다(예: `scripts/record_demo.mjs`).
**두 곳만 수정**한다: 상단 `CONFIG`(서버 URL·해상도·출력 폴더), 그리고 `storyboard()`(연출).

스토리보드 작성 전에 **앱 구조를 먼저 파악**한다, 뷰 전환 셀렉터(`[data-view]` 등), 핵심 버튼, 차별점이 보이는 패널의 CSS 셀렉터를 grep으로 찾아 `click()`/`scrollTo()` 대상에 넣는다.

좋은 데모의 4원칙:
1. **구조**: 표지(card) → 서비스 소개 → 핵심 시나리오 N개 → 마무리(card)
2. **동작을 보여줄 것**: 스크롤만 하지 말고 **실제 버튼을 `click()`** 해 상태 변화(타임라인 갱신·승인·차단 등)를 노출. "정적 보고서가 아니라 실제로 동작함"이 가장 강력한 메시지.
3. **차별점을 명시**: 핵심 가치/차별점이 화면에 보이는 순간 캡션으로 못 박는다.
4. **호흡**: 캡션 한 줄당 3.5~4s 유지(한글 가독성), 전환은 부드럽게. 5분 한도 안에서 **여유롭게 2~4분**이 황급한 1~2분보다 낫다.

## 2. 녹화
```bash
# 서버 기동 (정적앱 예시; 프레임워크면 해당 dev 서버)
python3 -m http.server 8011 --directory <app-dir> &
node scripts/record_demo.mjs        # → WEBM:<파일명> 출력
```

## 3. mp4 변환
```bash
cd <출력폴더>
ffmpeg -i <name>.webm -c:v libx264 -preset slow -crf 20 \
  -pix_fmt yuv420p -movflags +faststart -r 30 데모영상.mp4 -y
```
- `crf 20`=고화질(낮을수록 고화질·대용량). 용량 초과 시 23~26으로 올린다.
- `yuv420p`+`faststart`=폭넓은 호환(파워포인트·웹·모바일).

## 4. 검증 (생략 금지: 이게 핵심 가치)
영상은 DOCX/PPTX와 달리 **프레임을 추출해 육안 검증할 수 있다.** Read 도구로 PNG를 본다.
```bash
# 타임라인 곳곳 프레임 추출
for t in 4 20 40 60 90 110; do ffmpeg -ss $t -i 데모영상.mp4 -frames:v 1 /tmp/f_$t.png -y; done
# 길이·용량 하드 게이트
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 데모영상.mp4
```
추출한 프레임을 **Read로 열어 반드시 확인**:
- [ ] **한글 캡션이 □(tofu)가 아닌 진짜 글자**로 렌더되는가 (chromium 폰트 누락 시 실제 위험)
- [ ] 캡션·UI 겹침 없음, 글자 가독성 OK
- [ ] 차별점/핵심 패널이 실제로 화면에 보였는가
- [ ] **길이 ≤ 제한, 용량 ≤ 제한** (ffprobe 수치로 확인, 추정 금지)

## 5. 산출물 취급 (중요)
- **영상 파일을 git에 커밋하지 말 것**, 대용량이고, 공개 저장소는 검색 노출된다. 공모전은 "공개 플랫폼(유튜브 등) 업로드 금지" 규칙이 흔하다. `.gitignore`에 `*.mp4 *.webm`와 프레임 폴더를 넣고, **재생성 스크립트만 커밋**한다.
- 출력 폴더에 `README.md`로 사양(길이·용량·코덱)·규칙 준수표·재생성 명령·제출 채널을 남긴다.

## 핵심 기법 (template에 구현됨)
- **오버레이는 `document.body`에 부착** → SPA가 부분 렌더해도 캡션 생존. 단 전체 reload(`goto`) 후엔 `installOverlay()` 재호출(template의 `go()`가 처리).
- **`deviceScaleFactor:2`**로 또렷하게, `recordVideo.size`로 해상도 고정. 텍스트 밀집 콘솔은 1440×810 이상 권장.
- 캡션/카드는 opacity transition으로 부드럽게. 마지막 카드 fade-out 중 프레임은 반투명하게 보일 수 있음(정상).
- `context.close()`로 **video flush** 필수(안 하면 webm 손상).

## 흔한 함정
- `npx playwright --version`은 되는데 녹화가 비면 → chromium(full) 누락. `npx playwright install chromium`.
- 캡션이 안 보임 → `goto` 후 `installOverlay()` 누락. template의 `go()`를 쓸 것.
- 영상이 너무 빠름 → 캡션 hold(ms) 합이 곧 길이다. 라인당 3.5~4s로 키운다.
- 한글 □ → `CONFIG.fonts`에 시스템 한글 폰트 추가, 프레임으로 재검증.
