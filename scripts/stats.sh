#!/usr/bin/env bash
# STATS.md를 다시 만든다. 손으로 고치지 않는다: bash scripts/stats.sh
set -eu
cd "$(git rev-parse --show-toplevel)"
total=$(git rev-list --count HEAD)
ai=$(git log --grep '^Prompt-Ref: ' --format=%h | wc -l | tr -d ' ')
human=$(git log --grep '^Human-Only: true' --format=%h | wc -l | tr -d ' ')
prompts=$(grep -c '^| P[0-9]' ai/prompts.md || true)
overrides=$(grep -c '^| [0-9]' ai/overrides.md || true)
adr=$(ls docs/adr/[0-9]*.md 2>/dev/null | wc -l | tr -d ' ')
diagrams=$(git grep -h '^```mermaid' -- '*.md' | wc -l | tr -d ' ')
docs=$(git ls-files '*.md' | wc -l | tr -d ' ')
kt=$(git ls-files 'app/**/*.kt' | xargs cat 2>/dev/null | wc -l | tr -d ' ')
tests=$(git ls-files 'app/src/test/**/*.kt' 'app/src/androidTest/**/*.kt' | xargs grep -h '@Test' 2>/dev/null | wc -l | tr -d ' ')
cat > STATS.md <<MD
# STATS

숫자는 모두 이 저장소에서 다시 셀 수 있다. 이 파일은 \`bash scripts/stats.sh\`가 만든다(손으로 고치지 않음). README의 숫자는 여기서만 가져온다.

<sub>생성: $(git log -1 --format=%cs) · 기준 커밋: \`$(git rev-parse --short HEAD)\`</sub>

## 제품
| 지표 | 값 | 다시 세는 법 |
|---|---|---|
| Kotlin 코드 줄 | $kt | \`git ls-files 'app/**/*.kt' \| xargs cat \| wc -l\` |
| 테스트 수 | $tests | \`@Test\` 개수 (app/src/test, androidTest) |
| 결정 기록 (ADR) | $adr | \`ls docs/adr/[0-9]*.md\` |
| 도식 (Mermaid) | $diagrams | 문서 안 mermaid 코드 블록 수 |
| 문서 | $docs | \`git ls-files '*.md'\` |

## AI 협업
| 지표 | 값 | 다시 세는 법 |
|---|---|---|
| 전체 커밋 | $total | \`git rev-list --count HEAD\` |
| AI가 만든 커밋 (\`Prompt-Ref\`) | $ai | \`git log --grep '^Prompt-Ref: '\` |
| 사람이 직접 한 커밋 (\`Human-Only\`) | $human | \`git log --grep '^Human-Only: true'\` |
| 이 저장소를 바꾼 사람의 지시 | $prompts | [ai/prompts.md](ai/prompts.md) 행 수 |
| 사람이 뒤집은 AI 제안 | $overrides | [ai/overrides.md](ai/overrides.md) 행 수 |
MD
echo "STATS.md 갱신: 커밋 $total (AI $ai · 사람 $human)"
