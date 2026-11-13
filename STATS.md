# STATS

숫자는 모두 이 저장소에서 다시 셀 수 있다. 이 파일은 `bash scripts/stats.sh`가 만든다(손으로 고치지 않음). README의 숫자는 여기서만 가져온다.

<sub>생성: 2026-11-14 · 기준 커밋: `96589a9`</sub>

## 제품
| 지표 | 값 | 다시 세는 법 |
|---|---|---|
| Kotlin 코드 줄 | 0 | `git ls-files 'app/**/*.kt' \| xargs cat \| wc -l` |
| 테스트 수 | 0 | `@Test` 개수 (app/src/test, androidTest) |
| 결정 기록 (ADR) | 1 | `ls docs/adr/[0-9]*.md` |
| 도식 (Mermaid) | 13 | 문서 안 mermaid 코드 블록 수 |
| 문서 | 44 | `git ls-files '*.md'` |

## AI 협업
| 지표 | 값 | 다시 세는 법 |
|---|---|---|
| 전체 커밋 | 8 | `git rev-list --count HEAD` |
| AI가 만든 커밋 (`Prompt-Ref`) | 8 | `git log --grep '^Prompt-Ref: '` |
| 사람이 직접 한 커밋 (`Human-Only`) | 0 | `git log --grep '^Human-Only: true'` |
| 이 저장소를 바꾼 사람의 지시 | 8 | [ai/prompts.md](ai/prompts.md) 행 수 |
| 사람이 뒤집은 AI 제안 | 6 | [ai/overrides.md](ai/overrides.md) 행 수 |
