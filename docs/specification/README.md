# PlainUI specification baseline

T001 preserves the supplied revision 0.1 documents and records the proposed implementation baseline. The source documents remain **Proposed**. The revision 0.2 amendment set is also **Proposed** and has no recorded acceptance.

| Document | Purpose |
|---|---|
| [RFC revision 0.1](PlainUI-1.0-RFC-revision-0.1.md) | Complete transcription of the public contract |
| [Technical Design revision 0.1](PlainUI-1.0-Technical-Design-revision-0.1.md) | Complete transcription of the implementation design |
| [Decision record 0001](../decisions/0001-baseline.md) | C01–C14 selections, rationale, source clauses, fixture families, precedence, exclusions |
| [Revision 0.2 proposal](PlainUI-revision-0.2-proposal.md) | Complete proposed amendment text, including detailed-task and schema supplements |
| [Amendment inventory](revision-0.2-amendments.json) | 32 proposed clauses with IDs, source references, content hashes, and acceptance status |
| [Baseline manifest](../../evidence/spec-baseline.json) | Source hashes, titles, revision/date/status, transcript metrics and hashes, decision inventory |
| [T001 evidence](../../evidence/tasks/T001.md) | Completed acceptance checks and remaining revision acceptance gate |

The Markdown transcriptions preserve numbered headings, normative wording, table cells, code lines and indentation. Word-specific pagination, empty spacing paragraphs, font styling and page breaks are not part of the text transcription. Code-style paragraphs become HTML fences; tables become Markdown tables with escaped pipes/HTML characters. No source body content is summarized or omitted.

Run the repeatable source and decision checks from the repository root:

```text
python scripts/spec_baseline.py --check
```

The checker needs only the Python standard library. It verifies the source DOCX hashes, reconstructed paragraph/code/table text, transcript metadata, all 14 verbatim contract decisions, proposed amendment text and inventory, and the scope exclusions. Text hashes use UTF-8 with LF-normalized newlines so Windows Git line-ending conversion does not change the logical baseline. DOCX hashes always use the original raw bytes.

`--write` regenerates transcriptions and source metadata. It refuses to rebaseline a changed DOCX when an existing source hash is recorded; a changed source needs an explicit revision workflow. Do not use it to overwrite accepted specification text with a new source silently.

The proposal identifies two design conflicts explicitly: per-declaration TTL against acceptedAt instead of an authoritative shared expiresAt, and left-to-right segment specificity instead of ranking total literal count first. Neither resolution changes the preserved source transcription.

T002 may use the proposed implementation choices to initialize the workspace. Release qualification must use an explicitly accepted revision and its recorded acceptance. Completing T001 establishes the source baseline and reviewable proposal; it does not complete that later acceptance gate.
