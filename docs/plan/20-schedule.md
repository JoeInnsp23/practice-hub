# Schedule & Dependencies: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Total Duration**: 3 weeks (15 business days)
**Start Date**: 2025-10-28 (Week 1 Day 1)
**Target Production Date**: 2025-11-15 (Week 3 Day 1)

---

## Week 1: Critical Path + Decisions (5 days)

### Day 1 (Monday) - Decision Day + Critical Fix
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Decision Meeting**: DEC-001 (Social Hub), DEC-002 (Quotes) | Product Manager | 1 | None | Ready |
| **GAP-001**: My Tasks Filter (schema + query) | Backend Dev | 0.5 | None | Ready |
| **TEST-001**: My Tasks E2E test | QA Engineer | 1 | GAP-001 | Blocked |

**Go/No-Go Gate**: GAP-001 must pass TEST-001 before proceeding to Day 2.

### Day 2 (Tuesday) - Decision Closure + P1 Start
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Decision Meeting**: DEC-003 (Canvas Signatures) | Product Manager + Legal | 0.5 | None | Ready |
| **GAP-002**: Quote Management (if separate module) | Backend Dev | 4 | DEC-002 | Blocked |
| **GAP-003**: Proposal Activities Audit Trail | Backend Dev | 3 | GAP-001 complete | Blocked |

**Parallel Track**: If DEC-002 = "quotes are proposal variants", skip GAP-002 work (save 4 hours).

### Day 3 (Wednesday) - P1 Completion
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **GAP-004**: Invoice PDF Generation | Backend Dev | 3 | None | Ready |
| **TEST-002**: Proposal Signing E2E | QA Engineer | 2 | GAP-003 | Blocked |

### Day 4 (Thursday) - Test Coverage Expansion
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **TEST-003**: Client Portal Onboarding E2E | QA Engineer | 1 | None | Ready |
| **TEST-004**: Timesheet Approval E2E | QA Engineer | 1 | None | Ready |
| **TEST-005**: Bulk Operations E2E (optional P2) | QA Engineer | 1 | None | Deferred |

### Day 5 (Friday) - Week 1 Validation
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Run Full E2E Suite**: All tests (TEST-001 to TEST-004) | QA Engineer | 2 | All P0/P1 tests complete | Blocked |
| **Code Review**: All GAP fixes | Engineering Lead | 2 | All P1 items complete | Blocked |

**Go/No-Go Gate**: All P0/P1 tests must pass before Week 2.

---

## Week 2: QA Validation + Staging Deploy (5 days)

### Day 6 (Monday) - QA Deep Dive
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Regression Testing**: Full manual QA pass | QA Engineer | 4 | Week 1 complete | Blocked |
| **Performance Testing**: Task queries <500ms p95 | QA Engineer | 2 | None | Ready |

### Day 7 (Tuesday) - Bug Fixes
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Bug Triage**: Categorize P0/P1/P2 bugs | QA Engineer | 1 | Day 6 QA complete | Blocked |
| **P0 Bug Fixes**: Critical issues only | Backend Dev | 4 | Bug triage | Blocked |

**Go/No-Go Gate**: Zero P0 bugs before proceeding to staging.

### Day 8 (Wednesday) - Staging Prep
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Rollout Checklist**: Complete preflight items | DevOps | 2 | None | Ready |
| **Environment Variables**: Validate staging config | DevOps | 1 | None | Ready |
| **Database Seed**: Staging data setup | Backend Dev | 1 | None | Ready |

### Day 9 (Thursday) - Staging Deploy
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Deploy to Staging**: Follow rollout checklist | DevOps | 1 | Day 8 complete | Blocked |
| **Smoke Tests**: Validate core workflows | QA Engineer | 2 | Staging deploy | Blocked |
| **Telemetry Check**: SLOs configured and reporting | DevOps | 1 | Staging deploy | Blocked |

**Go/No-Go Gate**: All smoke tests must pass, SLOs green for 1 hour.

### Day 10 (Friday) - Staging Validation
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Stakeholder Demo**: Show staging to Product/Leadership | Product Manager | 1 | Staging stable | Blocked |
| **Final QA Pass**: Staging environment full regression | QA Engineer | 4 | Staging stable | Blocked |
| **Production Readiness Review**: Go/no-go meeting | All | 1 | QA pass | Blocked |

**Go/No-Go Gate**: Stakeholder approval + zero critical bugs in staging.

---

## Week 3: Production Deploy + Monitoring (1 day)

### Day 11 (Monday) - Production Launch
| Task | Owner | Hours | Dependencies | Status |
|------|-------|-------|--------------|--------|
| **Production Deploy**: Follow rollout checklist | DevOps | 1 | Week 2 approval | Blocked |
| **Smoke Tests**: Validate core workflows in prod | QA Engineer | 1 | Prod deploy | Blocked |
| **Telemetry Monitoring**: Watch dashboards (1 hour) | DevOps | 1 | Prod deploy | Blocked |
| **Incident Response Standby**: All hands on deck | All | 4 | Prod deploy | Blocked |

**SLO Validation** (post-deploy):
- Task list query performance: <500ms p95
- Task filter accuracy: 100% correct results
- Error rate: <1% for task operations
- No critical Sentry errors

---

## Dependency Graph (Critical Path)

```
Week 1:
┌──────────────┐
│ DEC-001/002  │ (Decision Meeting)
└──────┬───────┘
       │
       ├──────> GAP-001 (My Tasks) ──> TEST-001 (E2E) ─┐
       │                                                │
       ├──────> GAP-002 (Quotes) ──> (optional)        ├──> Week 1 Gate
       │                                                │
       ├──────> GAP-003 (Activities) ──> TEST-002      │
       │                                                │
       └──────> GAP-004 (Invoice PDF) ─────────────────┘

Week 2:
Week 1 Gate ──> QA Validation ──> Staging Deploy ──> Smoke Tests ──> Week 2 Gate

Week 3:
Week 2 Gate ──> Production Deploy ──> SLO Monitoring
```

### Critical Path Items (Must Complete)
1. **GAP-001** (My Tasks filter) - 0.5 hours
2. **TEST-001** (My Tasks E2E) - 1 hour
3. **QA Validation** (Week 2) - 6 hours
4. **Staging Deploy** (Week 2) - 4 hours
5. **Production Deploy** (Week 3) - 3 hours

**Total Critical Path**: 14.5 hours (blockers for production)

---

## Parallel Work Streams (Swimlanes)

### Backend Development
- Week 1: GAP-001, GAP-002, GAP-003, GAP-004 (10.5 hours)
- Week 2: Bug fixes (4 hours)
- Week 3: Production support (4 hours)

### QA Engineering
- Week 1: TEST-001, TEST-002, TEST-003, TEST-004 (5 hours)
- Week 2: Regression testing, bug triage, smoke tests (9 hours)
- Week 3: Production smoke tests (1 hour)

### DevOps
- Week 2: Rollout prep, staging deploy, telemetry setup (5 hours)
- Week 3: Production deploy, monitoring (3 hours)

### Product Management
- Week 1: Decision approvals (1.5 hours)
- Week 2: Stakeholder demo (1 hour)
- Week 3: Production readiness review (1 hour)

---

## Buffer Time & Risk Mitigation

### Built-in Buffer
- **Week 1**: 1 day buffer for decision delays or GAP-002 rework
- **Week 2**: 0.5 days buffer for bug fixes
- **Week 3**: 4 days buffer (only using Monday for deploy)

**Total Buffer**: 5.5 days (37% of schedule)

### Risk-Adjusted Timeline
If risks materialize:
- **RISK-001** (My Tasks regression): +1 day (Week 1 Day 2)
- **RISK-002** (Quote ambiguity): +1 day (Week 1 Day 3)
- **RISK-003** (E2E flakiness): +0.5 days (Week 2 Day 2)

**Worst-case timeline**: 3.5 weeks (still within buffer)

---

## Milestone Checklist

### M1: Week 1 Complete
- [ ] All P0 items complete (GAP-001 + TEST-001)
- [ ] All P1 items complete (GAP-002, GAP-003, GAP-004)
- [ ] All decisions closed (DEC-001, DEC-002, DEC-003)
- [ ] E2E test suite passing (TEST-001 to TEST-004)
- [ ] Code review complete
- [ ] Zero known P0 bugs

### M2: Week 2 Complete (Staging Ready)
- [ ] Full regression testing passed
- [ ] Rollout checklist 100% complete
- [ ] Staging deployed and stable
- [ ] Smoke tests passed
- [ ] SLOs configured and green
- [ ] Stakeholder approval obtained

### M3: Week 3 Complete (Production Live)
- [ ] Production deployed successfully
- [ ] Smoke tests passed in production
- [ ] SLOs validated (1 hour post-deploy)
- [ ] No critical incidents
- [ ] Telemetry dashboards operational

---

**Next Steps**:
1. Confirm start date with team (Week 1 Day 1 = 2025-10-28)
2. Assign owners for each task
3. Schedule decision meetings (DEC-001, DEC-002, DEC-003)
4. Set up daily standups for Week 1 and Week 2
