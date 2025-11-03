# Practice Hub – Master Launch Plan (Summary)

Updated: 2025-01-03  
Purpose: Executive timeline and coordination view  
Details: See LAUNCH_PLAN_REVISED.md for full content

---

## Timeline at a Glance (Aggressive 5 weeks)

- Week 1: Phase 0 (Doc Audit) + Phase 1 (Employee Hub) in parallel
- Week 2–3: Phase 2 (UI/UX polish) + Phase 3 (Xero) in parallel
- Week 3–4: Phase 4 (Workflow testing) + Phase 5 (Run all tests)
- Week 5: Phase 6 (UAT & bug fixes) → Phase 7 (Deploy)

---

## Key Deliverables by Week

- Week 1: Clean docs; Employee Hub created and migrated (timesheets, leave, TOIL)
- Week 2: Enhanced design system; polished components; login redesign; landing page
- Week 3: Xero invoice sync end‑to‑end; all hubs polished; browser‑tested
- Week 4: All workflows validated; 1,389+ tests passing; perf tests green
- Week 5: UAT sign‑off; production deploy; 48‑hour monitoring

---

## Agents & Ownership

- Analyst (Mary): Phase 0  
- Dev (James): Phase 1, Phase 3, Phase 5, Phase 7  
- UX (Sally): Phase 2  
- QA (Quinn): Phase 4, Phase 5  
- PM (John): Phase 6

---

## Parallelization Rules

- Phase 0 and Phase 1 share no files → run together.  
- Phase 2 (UI) and Phase 3 (Xero) affect different areas → run together.  
- Phase 4 (workflow) can overlap with late Phase 5 (suite) where safe.

---

## Go/No‑Go Gates

- Gate A (end Week 1): Employee Hub functional; doc audit complete.  
- Gate B (end Week 3): Hubs polished; Xero sandbox verified.  
- Gate C (end Week 4): All tests pass; workflows validated.  
- Gate D (UAT): P0 issues fixed; release approved.

---

## Risks Snapshot

- Employee Hub refactor time  
- UI polish scope creep  
- Xero unknowns and sandbox delays  
- E2E coverage gaps after UI changes

Mitigation: early starts, frequent reviews, strict P0/P1 scoping, parallel tracks.


