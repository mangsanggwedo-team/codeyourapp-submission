#!/usr/bin/env python3
"""필요한 스킬·플러그인 찾기. 사용: python3 -I scripts/find-skill.py 모션 영상 [--all]
찾는 곳 (가까운 순): 1 우리 스킬 → 2 이 맥에 받아 둔 마켓플레이스의 SKILL.md(설치 여부 무관) → 3 Anthropic Directory 목록(3천여 개).
단어가 많이 맞을수록 위. 한국어·영어 둘 다 넣으면 잘 찾는다(예: 모션 motion video)."""
import json, os, re, sys
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
words = [w.lower() for w in args]
limit = 999 if "--all" in sys.argv else 8
ROOT = Path(__file__).resolve().parent.parent
PL = Path.home() / ".claude" / "plugins"

def score(text):
    t = text.lower()
    return sum(t.count(w) for w in words)

def frontmatter(p):
    try:
        s = p.read_text(errors="ignore")[:3000]
    except OSError:
        return "", ""
    name = re.search(r"^name:\s*(.+)$", s, re.M)
    desc = re.search(r"^description:\s*(.+)$", s, re.M)
    return (name.group(1).strip() if name else p.parent.name), (desc.group(1).strip() if desc else "")

def show(title, rows):
    rows = sorted((r for r in rows if r[0] > 0), key=lambda r: -r[0])[:limit]
    print(f"\n## {title} ({len(rows)})")
    for sc, name, where, desc in rows:
        print(f"- [{sc}] {name}  ({where})\n    {desc[:150]}")

# 1. 우리 스킬
ours = []
for p in (ROOT / ".agents" / "skills").glob("*/SKILL.md"):
    n, d = frontmatter(p)
    ours.append((score(n + " " + d), n, "우리 스킬", d))
show("1. 우리 스킬 (.agents/skills)", ours)

# 2. 받아 둔 마켓플레이스·캐시의 스킬
installed = set()
try:
    installed = {k.split("@")[0] for k in json.load(open(PL / "installed_plugins.json")).get("plugins", {})}
except Exception:
    pass
seen, local = set(), []
for base in (PL / "marketplaces", PL / "cache"):
    for p in base.rglob("SKILL.md"):
        n, d = frontmatter(p)
        parts = p.relative_to(base).parts
        key = (parts[0], n)
        if key in seen:
            continue
        seen.add(key)
        plugin = next((x for x in parts[1:] if x in installed), None)
        local.append((score(n + " " + d), n, f"{parts[0]}" + (" · 설치됨" if plugin else ""), d))
show("2. 받아 둔 마켓플레이스 (설치 안 된 것도 포함)", local)

# 3. Anthropic Directory
try:
    listings = json.load(open(PL / "plugin-directory-cache-v2.json"))["listings"]
except Exception:
    listings = []
dirrows = []
for x in listings:
    text = f"{x.get('name','')} {x.get('summary','')}"
    repo = ((x.get("source") or {}).get("repository") or {}).get("url", "")
    reviewed = ((x.get("checks") or {}).get("review") or {}).get("state", "")
    dirrows.append((score(text), x.get("name", ""), f"{repo} · 검토 {reviewed or '없음'}", x.get("summary", "")))
show(f"3. Anthropic Directory ({len(listings)}개 중)", dirrows)
print("\n설치: claude plugin install <플러그인>@<마켓> --scope project  → 쓰기 전 skill-scout 스킬의 점검표.")
