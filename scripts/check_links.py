"""md 링크 점검: 깨진 상대경로 링크 + 어디서도 링크 안 된 문서(고아).  python3 -I scripts/map_check.py [--strict]
--strict: 깨진 상대 링크가 하나라도 있으면 exit 1 (CI용)."""
import os, re, sys, urllib.parse
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
skip = {".git", "node_modules", ".obsidian"}
mds = []
for d, ds, fs in os.walk(root):
    ds[:] = [x for x in ds if x not in skip and not os.path.islink(os.path.join(d, x))]
    mds += [os.path.join(d, f) for f in fs if f.endswith(".md")]
link = re.compile(r"\]\(([^)#\s]+)(?:#[^)]*)?\)")
broken, linked = [], set()
for p in mds:
    txt = re.sub(r"```.*?```", "", open(p, encoding="utf-8").read(), flags=re.S)
    txt = re.sub(r"`[^`\n]*`", "", txt)
    for t in link.findall(txt):
        if re.match(r"^[a-z]+:", t): continue
        q = os.path.normpath(os.path.join(os.path.dirname(p), urllib.parse.unquote(t)))
        if os.path.exists(q): linked.add(q)
        else: broken.append((os.path.relpath(p, root), t))
core = lambda f: True  # 제출 저장소는 모든 문서가 심사 대상
hard = [b for b in broken if core(b[0])]
orph = sorted(os.path.relpath(p, root) for p in mds if p not in linked and not p.endswith("README.md") and os.path.dirname(p) != root)
print(f"문서 {len(mds)}개 · 깨진 링크 {len(broken)} (핵심 {len(hard)}) · 고아 {len(orph)}")
for f, t in broken: print(("  ✗ " if core(f) else "  · ") + f"{f} → {t}")
if "-v" in sys.argv: print("고아:"); [print("  ", o) for o in orph]
sys.exit(1 if "--strict" in sys.argv and hard else 0)
