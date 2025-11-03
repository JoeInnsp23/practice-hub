# Phase 0: Documentation Audit & Cleanup

Duration: 5–6 days (Week 1)  
Runs parallel with: Phase 1 (Employee Hub)

---

## Goal

Create a trustworthy documentation set: deduplicated, accurate, navigable, and maintained.

---

## Tasks

1) Inventory (Day 1)
- Recursively list all docs/ files; capture path, title, last modified, size/word count, category (architecture, guide, reference, ops, dev, testing, modules, pricing, gap‑analysis), and status guess (current/outdated/duplicate/draft).
- Output: docs/90-completed/phase-0/audit/inventory.md

2) Detect duplicates & conflicts (Day 1–2)
- Compare related topics across files; note duplication, conflicts, obsolete guidance; flag orphaned docs.
- Output: docs/90-completed/phase-0/audit/duplicates-and-conflicts.md

3) Validate against codebase (Day 2)
- Cross‑check schema vs lib/db/schema.ts, routers vs app/server/routers, components vs components/, integrations vs lib/*.
- Mark docs as ✅ accurate / ⚠️ outdated / ❌ incorrect / 📝 incomplete.
- Output: docs/90-completed/phase-0/audit/accuracy-report.md

4) Consolidation plan (Day 2–3)
- Define KEEP/MERGE/ARCHIVE/UPDATE per topic.
- Single source of truth: bmm-brownfield-architecture.md + module READMEs + key guides.
- Output: docs/90-completed/phase-0/audit/consolidation-plan.md

5) Execute cleanup (Day 3–4)
- Create docs/.archive/audit-YYYY-MM-DD/ and move historical/outdated content.  
- Merge duplicates into primaries, remove redundant content (keep history in archive).  
- Update outdated sections and examples.  
- Add “Last verified” metadata.  
- Outputs: archived files + updated docs.

6) Update navigation (Day 4–5)
- Refresh docs/README.md and bmm-index.md; ensure all important docs are linked.  
- Fix broken links; update sitemap if present.  
- Output: updated navigation docs.

7) Maintenance process (Day 5)
- Add docs/DOCUMENTATION_MAINTENANCE.md covering ownership, frequency, deprecation, archive policy, AI agent update rules.  
- Output: maintenance guide.

8) Final validation (Day 5–6)
- Check inventory is fully accounted; run link checker; spot‑check accuracy.
- Output: docs/90-completed/phase-0/audit/final-report.md with before/after counts and decisions.

---

## Deliverables

- Inventory, duplicates/conflicts, accuracy report, consolidation plan, final report.  
- Cleaned docs tree with archive.  
- Updated navigation and maintenance process.

---

## Success Criteria

- ~50% fewer top-level docs via consolidation with zero info loss.  
- No obvious conflicts or outdated guidance.  
- Primary references (brownfield architecture, module READMEs) stay current.  
- Clear ownership and cadence to prevent drift.


