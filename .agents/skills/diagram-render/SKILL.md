---
name: diagram-render
description: 설명용 다이어그램·보드를 HTML로 짜서 헤드리스 Chrome으로 PNG를 만든다. 팀 하우스 스타일(Pretendard, #6D4AFF, 바탕 #FAFAF8). 트리거: "다이어그램", "구조도", "그림으로", "PNG로 뽑아".
---

# diagram-render: HTML → PNG

- 원본: `30_design/source-assets/diagrams/<이름>.html` (공통 `base.css` 링크). 결과: `docs/assets/diagrams/<이름>.png`.
- 렌더:
  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
    --window-size=1600,1000 --screenshot=docs/assets/diagrams/<이름>.png "file://$PWD/30_design/source-assets/diagrams/<이름>.html"
  ```
- 렌더 후 **반드시 PNG를 열어** 겹침·잘림·빈 여백 확인. 원문자(①) 같은 작은 글리프는 깨지기 쉬우니 숫자로.
- 글꼴 Pretendard(SIL OFL) 설치 필요. 색은 `DESIGN.md`. 문서에 넣을 땐 상대경로 이미지 링크(GitHub·옵시디언 둘 다 보임).
