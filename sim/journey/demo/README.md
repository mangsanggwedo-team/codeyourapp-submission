# 시연영상 초안 녹화

여정 시뮬레이션(`../index.html`)을 자막을 넣어 녹화한다. 무음, 약 2분 30초, 1600×900.

| 구간 | 내용 |
|---|---|
| 표지 | 룸19, 한 줄 정의 |
| 시나리오 A | 준비 → 문턱 → 숨 → 머묾 → 돌아옴(버튼 없이 닫힘) → 출발 준비 |
| 신호 넣기 | 머묾 10분째에 벨트 맴(확률 오름), 다시 기댐(확률 내림) |
| 시나리오 C | 머무는 중 기어 이탈 → 즉시 복원 |
| 마무리 | "시뮬레이션은 설계값 재생이며 실차 실측이 아님" |

## 다시 만들기
```bash
cd sim/journey
python3 -m http.server 8011 &
npm i --prefix /tmp/demo-rec playwright && ln -sfn /tmp/demo-rec/node_modules demo/node_modules
node demo/record_demo.mjs          # 시스템 Chrome 사용, demo/out/*.webm
cd demo/out && ffmpeg -i *.webm -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart -r 30 룸19_시연영상_초안.mp4
```
영상 파일은 커밋하지 않는다(`.gitignore`).
