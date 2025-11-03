# Agent Assignment Matrix – Parallel Execution

Updated: 2025-01-03  
Use: Run multiple Cursor sessions with specialized agents

---

## Week 1 – Start Two Sessions

Session 1 – Documentation Audit
- Agent: /bmad/bmm/agents/analyst (Mary)
- Task: Execute Phase 0 using docs/PHASE_0_DOC_AUDIT.md
- Output: inventory, duplicates/conflicts, consolidation plan, final report
- Conflicts: none (docs only)

Session 2 – Employee Hub Creation
- Agent: /bmad/bmm/agents/dev (James)
- Task: Execute Phase 1 using docs/PHASE_1_EMPLOYEE_HUB.md
- Output: new app/employee-hub/, migrated features, tests passing
- Conflicts: none (code changes, no doc edits)

---

## Week 2–3 – UI + Xero in Parallel

Session 3 – UI/UX Polish (after Employee Hub exists)
- Agent: /bmad/bmm/agents/ux-designer (Sally) or /bmad/bmm/agents/dev
- Task: Phase 2 (polish all hubs, keep colors, dark mode; redesign sign‑in; new landing page; browser testing)
- Files: app/, components/

Session 4 – Xero Integration
- Agent: /bmad/bmm/agents/dev
- Task: Phase 3 (finish lib/xero; invoices router; UI controls; sandbox tests)
- Files: lib/xero/, app/server/routers/invoices.ts, invoice UI

---

## Week 3–4 – Testing Tracks

Session 5 – Workflow Testing
- Agent: /bmad/bmm/agents/qa (Quinn) or /bmad/bmm/agents/dev
- Task: Phase 4; validate all workflows across hubs + integrations

Session 6 – Full Test Suite
- Agent: /bmad/bmm/agents/dev or /bmad/bmm/agents/qa
- Task: Phase 5; run 1,389+ tests, performance, Playwright E2E, fix failures

---

## Week 5 – UAT & Deploy

Session 7 – UAT + Release
- Agent: /bmad/bmm/agents/pm or /bmad/bmm/agents/dev
- Task: Phase 6 UAT, triage, then Phase 7 deployment and monitoring

---

## Conflict Matrix

- Session 1 vs 2: independent (docs vs code).  
- Session 3 vs 4: low overlap (UI vs lib/xero).  
- Session 5 vs 6: can overlap late in week.

---

## Quick Start Prompts

- Analyst: “Execute Phase 0 Doc Audit. Read docs/PHASE_0_DOC_AUDIT.md and begin Task 1.”
- Dev: “Create Employee Hub. Read docs/PHASE_1_EMPLOYEE_HUB.md and begin Task 1.”
- UX: “Polish all hubs per Phase 2; keep colors and dark mode; redesign sign‑in; add landing page; browser test.”
- Dev (Xero): “Finish invoice sync end‑to‑end; wire to router/UI; sandbox test.”
- QA: “Test all workflows and integrations end‑to‑end; produce report.”


