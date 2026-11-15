#!/usr/bin/env python3
"""data_*.json 을 index.html 의 <script id="lib-data"> 에 넣는다. 데이터셋이 늘면 다시 돌린다.
  python3 build.py"""
import json, re, pathlib
here = pathlib.Path(__file__).parent
GROUP = {"data_hmc.json": "현대차 재무·판매", "data_social.json": None}
V = {}
for vf in ("audit_verdicts_hmc.json", "audit_verdicts_social.json"):
    if (here / vf).exists():
        V.update(json.loads((here / vf).read_text()))
lib = []
for f, g in GROUP.items():
    p = here / f
    if not p.exists():
        continue
    for d in json.loads(p.read_text())["datasets"]:
        d["group"] = g or ("세계" if d["id"].startswith(("global", "us_")) else "한국 사회")
        if not (d.get("columns") and d.get("rows") and d.get("level")):
            print("skip (빈 데이터):", d.get("id"))
            continue
        if d["id"] in V:
            d["verdict"] = V[d["id"]]
        lib.append(d)
html = (here / "index.html").read_text()
blob = json.dumps(lib, ensure_ascii=False).replace("</", "<\\/")
html = re.sub(r'(<script id="lib-data" type="application/json">).*?(</script>)', lambda m: m.group(1) + blob + m.group(2), html, flags=re.S)
(here / "index.html").write_text(html)
print(f"datasets {len(lib)}")
