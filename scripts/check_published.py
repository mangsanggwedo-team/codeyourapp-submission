#!/usr/bin/env python3
"""제출 저장소 공개 점검 (CI와 publish.py가 같이 쓴다).

1. 출판 파일 무결성: .published.json에 적힌 파일은 팀 원본 저장소에서 출판된 것이다.
   여기서 직접 고치면 다음 출판 때 덮어써지므로, 해시가 다르면 실패로 알린다.
2. 공개 금지 내용: 정보자산 파일, 전화번호, 비밀키, 로컬 절대경로, 허용 목록 밖 이메일.
사용: python3 scripts/check_published.py [--root 경로]   (실패하면 exit 1)
"""
import hashlib, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(sys.argv[sys.argv.index("--root") + 1]) if "--root" in sys.argv else Path(__file__).resolve().parent.parent
BAD_PATH = re.compile(r"form-original/|동의서|서명|카톡.*\.csv$|(^|/)\.env($|\.)|\.(pem|key|keystore|jks)$")
BAD_TEXT = [
    ("전화번호", re.compile(r"(^|[^0-9A-Za-z/_-])01[016789]-[0-9]{3,4}-[0-9]{4}([^0-9]|$)")),
    ("비밀키", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}")),
    ("주민번호", re.compile(r"(^|[^0-9])[0-9]{6}-[1-4][0-9]{6}([^0-9]|$)")),
    ("카드번호", re.compile(r"(^|[^0-9])[0-9]{4}[- ][0-9]{4}[- ][0-9]{4}[- ][0-9]{4}([^0-9]|$)")),
    ("로컬 절대경로", re.compile(r"/Users/[A-Za-z0-9._-]+/|/home/[a-z0-9._-]+/")),
    ("이메일", re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")),
]
EMAIL_OK = {"noreply@anthropic.com"}
TEXT_EXT = {".md", ".txt", ".tsv", ".json", ".kt", ".kts", ".xml", ".py", ".sh", ".yml", ".yaml", ".html", ".mjs", ".js", ".gradle", ".properties", ""}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def tracked():
    # 추적 중 + 새로 생겼지만 무시되지 않는 파일 (커밋 전 점검에서도 빠지지 않게)
    out = subprocess.run(["git", "-C", str(ROOT), "-c", "core.quotepath=off", "ls-files", "--cached", "--others", "--exclude-standard"], capture_output=True, text=True).stdout
    return [l for l in out.splitlines() if l]


def main():
    errors = []
    pub = ROOT / ".published.json"
    if pub.exists():
        for rel, meta in json.loads(pub.read_text())["files"].items():
            f = ROOT / rel
            if not f.exists():
                errors.append(f"출판 파일 없음: {rel} (원본 {meta['source']})")
            elif sha(f) != meta["sha256"]:
                errors.append(f"출판 파일을 여기서 고침: {rel} → 팀 원본 {meta['source']}을 고치고 publish.py로 다시 출판")
    for rel in tracked():
        if BAD_PATH.search(rel):
            errors.append(f"공개 금지 파일: {rel}")
            continue
        f = ROOT / rel
        if f.suffix not in TEXT_EXT or not f.is_file() or rel == "scripts/check_published.py":
            continue
        try:
            text = f.read_text()
        except UnicodeDecodeError:
            continue
        for n, line in enumerate(text.splitlines(), 1):
            for name, rx in BAD_TEXT:
                for m in rx.finditer(line):
                    if name == "이메일" and (m.group(0) in EMAIL_OK or "@users.noreply.github.com" in m.group(0)):
                        continue
                    errors.append(f"{name}: {rel}:{n}: {line.strip()[:90]}")
    if errors:
        print("공개 점검 실패")
        for e in errors[:80]:
            print(" ·", e)
        sys.exit(1)
    print(f"공개 점검 통과 (파일 {len(tracked())}개, 출판 파일 {len(json.loads(pub.read_text())['files']) if pub.exists() else 0}개)")


if __name__ == "__main__":
    main()
