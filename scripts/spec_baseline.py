"""Generate and verify the T001 source transcriptions without changing the DOCX files.

Usage: python scripts/spec_baseline.py --write | --check
Only the Python standard library is needed. Paths are rooted at this repository.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
SOURCES = (
    ("specs/PlainUI-1.0-RFC.docx", "docs/specification/PlainUI-1.0-RFC-revision-0.1.md"),
    ("specs/PlainUI-1.0-Technical-Design.docx", "docs/specification/PlainUI-1.0-Technical-Design-revision-0.1.md"),
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def paragraph_text(node: ET.Element) -> str:
    result = []
    for child in node.iter():
        if child.tag == W + "t":
            result.append(child.text or "")
        elif child.tag == W + "tab":
            result.append("\t")
        elif child.tag in (W + "br", W + "cr"):
            # Page breaks affect layout only, not the body text transcript.
            if child.get(W + "type") != "page":
                result.append("\n")
    return "".join(result)


def read_source(relative: str) -> list[dict]:
    with ZipFile(ROOT / relative) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
        if document.find(".//" + W + "ins") is not None or document.find(".//" + W + "del") is not None:
            raise ValueError(f"Tracked changes require explicit review: {relative}")
        if document.find(".//" + W + "txbxContent") is not None:
            raise ValueError(f"Text box content requires explicit review: {relative}")
        if any(n.startswith("word/media/") for n in archive.namelist()):
            raise ValueError(f"Embedded media requires explicit review: {relative}")
        for name in ("word/footnotes.xml", "word/endnotes.xml", "word/comments.xml"):
            if name in archive.namelist():
                raise ValueError(f"Additional source content requires explicit review: {name}")
        body = document.find(W + "body")
        if body is None:
            raise ValueError("Missing document body")
        blocks = []
        for node in body:
            if node.tag == W + "p":
                style = node.find(W + "pPr/" + W + "pStyle")
                blocks.append({"kind": "paragraph", "style": style.get(W + "val") if style is not None else "Normal", "text": paragraph_text(node)})
            elif node.tag == W + "tbl":
                rows = []
                for row in node.findall(W + "tr"):
                    cells = []
                    for cell in row.findall(W + "tc"):
                        if cell.find(W + "tbl") is not None:
                            raise ValueError("Nested tables require explicit review")
                        cells.append("\n".join(paragraph_text(p) for p in cell.findall(W + "p")))
                    rows.append(cells)
                if not rows or any(len(row) != len(rows[0]) for row in rows):
                    raise ValueError("Irregular/merged table requires explicit review")
                blocks.append({"kind": "table", "rows": rows})
            elif node.tag != W + "sectPr":
                raise ValueError(f"Unsupported document-body element: {node.tag}")
        return blocks


def table_cell(value: str) -> str:
    return html.escape(value, quote=False).replace("|", "&#124;").replace("\n", "<br>")


def render(blocks: list[dict]) -> str:
    lines = []
    code = []

    def finish_code() -> None:
        if code:
            lines.extend(["```html", *code, "```", ""])
            code.clear()

    for block in blocks:
        if block["kind"] == "table":
            finish_code()
            rows = block["rows"]
            lines.append("| " + " | ".join(table_cell(v) for v in rows[0]) + " |")
            lines.append("| " + " | ".join("---" for _ in rows[0]) + " |")
            lines.extend("| " + " | ".join(table_cell(v) for v in row) + " |" for row in rows[1:])
            lines.append("")
            continue
        text, style = block["text"], block["style"]
        if style == "Code":
            code.append(text)
            continue
        finish_code()
        if not text:
            continue
        if style == "Title":
            lines.append("# " + text)
        elif style.startswith("Heading") and style[7:].isdigit():
            lines.append("#" * (int(style[7:]) + 1) + " " + text)
        elif style == "Subtitle":
            lines.append("*" + text + "*")
        else:
            lines.append(text)
        lines.append("")
    finish_code()
    return "\n".join(lines).rstrip() + "\n"


def parse_transcription(markdown: str) -> list[dict]:
    """Independently reconstruct visible text and table cells from our simple MD format."""
    blocks = []
    lines = markdown.splitlines()
    index = 0
    in_code = False
    while index < len(lines):
        line = lines[index]
        if line == "```html":
            in_code = True
        elif in_code and line == "```":
            in_code = False
        elif in_code:
            blocks.append({"kind": "paragraph", "style": "Code", "text": line})
        elif line.startswith("| "):
            rows = []
            while index < len(lines) and lines[index].startswith("| "):
                row = lines[index]
                if not re.fullmatch(r"\|(?: --- \|)+", row):
                    rows.append([html.unescape(v.replace("<br>", "\n")) for v in row[2:-2].split(" | ")])
                index += 1
            blocks.append({"kind": "table", "rows": rows})
            continue
        elif line:
            heading = re.match(r"^(#+) (.*)$", line)
            if heading:
                style = "Title" if len(heading[1]) == 1 else f"Heading{len(heading[1])-1}"
                blocks.append({"kind": "paragraph", "style": style, "text": heading[2]})
            elif line.startswith("*") and line.endswith("*"):
                blocks.append({"kind": "paragraph", "style": "Subtitle", "text": line[1:-1]})
            else:
                blocks.append({"kind": "paragraph", "style": "Normal", "text": line})
        index += 1
    if in_code:
        raise ValueError("Unclosed code block")
    return blocks


def source_metadata(source: str, target: str, blocks: list[dict], markdown: bytes) -> dict:
    texts = [b["text"] for b in blocks if b["kind"] == "paragraph" and b["text"]]
    tables = [b for b in blocks if b["kind"] == "table"]
    revision = next(t for t in texts if "Revision 0.1" in t and "Status Proposed" in t)
    return {
        "path": source, "sha256": digest((ROOT / source).read_bytes()),
        "title": texts[0], "revision": "0.1", "date": "2026-10-10", "status": "Proposed", "revisionLine": revision,
        "transcription": target, "transcriptionSha256": digest(markdown),
        "transcriptionHashMode": "utf8-lf-normalized",
        "nonemptyParagraphs": len(texts), "codeLines": sum(b.get("style") == "Code" for b in blocks),
        "tables": len(tables), "tableRows": sum(len(b["rows"]) for b in tables),
        "tableCells": sum(sum(len(r) for r in b["rows"]) for b in tables),
        "normativeKeywords": {word: len(re.findall(r"\b" + word + r"\b", "\n".join(texts + [v for b in tables for r in b["rows"] for v in r]))) for word in ("MUST", "MUST NOT", "SHOULD", "MAY")},
    }


def validate_decisions(manifest: dict) -> None:
    contract = (ROOT / manifest["implementationContract"]["path"]).read_text(encoding="utf-8")
    if digest(contract.encode("utf-8")) != manifest["implementationContract"]["sha256"]:
        raise ValueError("Implementation contract changed from the recorded baseline")
    sections = {m[1]: m[3].strip() for m in re.finditer(r"^## (C\d{2}) ([^\n]+)\n(.*?)(?=^## |\Z)", contract, re.M | re.S)}
    expected_ids = {f"C{i:02}" for i in range(1, 15)}
    decisions = manifest["decisions"]["items"]
    if set(sections) != expected_ids or {d["id"] for d in decisions} != expected_ids or len(decisions) != 14:
        raise ValueError("Decision record must cover C01 through C14 exactly once")
    adr = (ROOT / manifest["decisions"]["path"]).read_text(encoding="utf-8")
    for decision in decisions:
        cid = decision["id"]
        copied = re.search(rf"<!-- contract:{cid}:begin -->\n(.*?)\n<!-- contract:{cid}:end -->", adr, re.S)
        if not copied or copied[1] != sections[cid] or digest(copied[1].encode("utf-8")) != decision["selectedBehaviorSha256"]:
            raise ValueError(f"Decision selected behavior differs from the plan: {cid}")
        for key in ("sourceClauses", "rationale", "fixtureFamilies", "classification"):
            if not decision[key]:
                raise ValueError(f"Missing decision field {key}: {cid}")
    exclusions = re.search(r"^## Release scope exclusions\n(.*?)(?=^## |\Z)", (ROOT / "specs/implementation/00-plan.md").read_text(encoding="utf-8"), re.M | re.S)[1].strip()
    if exclusions not in adr or digest(exclusions.encode("utf-8")) != manifest["exclusions"]["textSha256"]:
        raise ValueError("Exclusions differ from the implementation plan")
    inventory = json.loads((ROOT / manifest["clarifications"]["inventory"]).read_text(encoding="utf-8"))
    amendments = inventory["amendments"]
    if [a["id"] for a in amendments] != manifest["clarifications"]["ids"] or len(amendments) != manifest["clarifications"]["count"]:
        raise ValueError("Amendment inventory count or IDs differ")
    proposal = (ROOT / inventory["proposal"]).read_text(encoding="utf-8")
    proposal_sections = {m[1]: m[2] for m in re.finditer(r"^### ([AS]\d{3}) [^\n]+\n(.*?)(?=^### [AS]\d{3} |^## |\Z)", proposal, re.M | re.S)}
    if set(proposal_sections) != {a["id"] for a in amendments}:
        raise ValueError("Proposal headings and amendment inventory differ")
    tasks = {t["id"]: t for t in json.loads((ROOT / "specs/implementation/tasks.json").read_text(encoding="utf-8"))["tasks"]}
    for amendment in amendments:
        if amendment["decision"]:
            selected = sections[amendment["decision"]]
        elif amendment["task"]:
            task = tasks[amendment["task"]]
            selected = "\n\n".join(f'{n}. {task["implementationSteps"][n-1]}' for n in amendment["steps"])
        else:
            schema = (ROOT / amendment["planSource"]).read_text(encoding="utf-8")
            selected = schema[schema.index("## Exact binding allowlist"):].strip()
        # S018 contains nested ## headings copied from schema; check its entire
        # trailing proposal region rather than treating those as clause endings.
        clause = proposal_sections[amendment["id"]]
        if amendment["id"] == "S018":
            clause = proposal[proposal.index("### S018 "):]
        if selected not in clause or digest(selected.encode("utf-8")) != amendment["textSha256"]:
            raise ValueError(f"Amendment differs from selected plan text: {amendment['id']}")
    if inventory["status"] == "proposed" and any(inventory[k] is not None for k in ("acceptedBy", "acceptedAt", "acceptedDocumentSha256")):
        raise ValueError("Proposed revision must not claim acceptance")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--write", action="store_true")
    group.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest_path = ROOT / "evidence/spec-baseline.json"
    existing = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else None
    if not args.write and existing is None:
        raise ValueError("Missing baseline manifest; run --write first")
    source_records = []
    for source, target in SOURCES:
        blocks = read_source(source)
        nonempty = [b for b in blocks if b["kind"] == "table" or b["text"]]
        expected = render(blocks).encode("utf-8")
        if parse_transcription(expected.decode("utf-8")) != nonempty:
            raise ValueError(f"Source-to-Markdown roundtrip failed: {source}")
        dest = ROOT / target
        if args.write:
            # Re-baselining a changed source requires an explicit manifest revision.
            old = next((s for s in existing["sources"] if s["path"] == source), None) if existing else None
            if old and old["sha256"] != digest((ROOT / source).read_bytes()):
                raise ValueError(f"Refusing to overwrite a baseline for changed source: {source}")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(expected)
        actual = dest.read_text(encoding="utf-8").encode("utf-8")
        if actual != expected or parse_transcription(actual.decode("utf-8")) != nonempty:
            raise ValueError(f"Transcription differs from source: {target}")
        source_records.append(source_metadata(source, target, blocks, actual))
    if args.write:
        manifest = existing or {"schemaVersion": 1, "task": "T001", "recordedDate": "2026-10-10", "sourceCommit": "1bcdaff", "baselineStatus": "source-revision-0.1-preserved", "proposalStatus": "proposed-not-accepted"}
        manifest["sources"] = source_records
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    elif existing["sources"] != source_records:
        raise ValueError("Manifest source metadata/digests differ")
    if existing and "decisions" in existing:
        validate_decisions(existing)
    print(json.dumps({"result": "pass", "sources": len(source_records), "paragraphs": sum(s["nonemptyParagraphs"] for s in source_records), "codeLines": sum(s["codeLines"] for s in source_records), "tables": sum(s["tables"] for s in source_records), "tableRows": sum(s["tableRows"] for s in source_records), "tableCells": sum(s["tableCells"] for s in source_records), "decisions": len(existing["decisions"]["items"]) if existing and "decisions" in existing else 0, "amendments": existing["clarifications"]["count"] if existing and "clarifications" in existing else 0}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, ET.ParseError) as error:
        print(f"Baseline validation failed: {error}", file=sys.stderr)
        sys.exit(1)
