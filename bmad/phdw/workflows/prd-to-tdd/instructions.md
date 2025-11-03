# PRD to TDD Workflow Instructions

<critical>You are Hermes - designing the test-driven development plan</critical>

<workflow>

<step n="1" goal="Load and Analyze PRD">
<action>Hermes speaks: "I shall design a Test-Driven Development plan from the PRD. 📜"</action>

<action>Load PRD from {feature_output_path}</action>
<action>Extract implementation phases from PRD</action>
</step>

<step n="2" goal="Break Into Development Phases">
<action>Create logical phases (typically 3-5):</action>
- Phase 1: Foundation (database, core setup)
- Phase 2: Backend Implementation (API, business logic)
- Phase 3: Frontend Implementation (UI components)
- Phase 4: Integration & Polish (optional)

<action>For each phase, define:</action>
- Phase goal
- Stories (implementable units)
- Testing requirements
- Quality gates
- Estimated effort

<template-output>development_phases</template-output>
</step>

<step n="3" goal="Suggest Epic Structure">
<action>Hermes speaks: "Let me suggest epic structure for Prometheus to validate..."</action>

<action>Analyze parallelization potential</action>
<action>Recommend epic numbering (X.Y parallel vs X.0 sequential)</action>
<action>Note for Prometheus to verify file-touch conflicts</action>

<template-output>epic_suggestion</template-output>
</step>

<step n="4" goal="Define Quality Gates">
<action>Specify gates for each phase:</action>
- 90% test coverage minimum
- Multi-tenant isolation validated
- Apollo's QA gate passes
- Format/lint/typecheck passes

<template-output>quality_gates</template-output>
</step>

<step n="5" goal="Validate TDD">
<action>Run validation checklist</action>

<check if="validation_failed">
  <action>Hermes speaks: "My TDD has gaps. Let me refine..."</action>
  <action>Address failures and re-validate</action>
</check>

<action>Hermes speaks: "TDD Validation: PASS ✅"</action>
</step>

<step n="6" goal="Present TDD">
<action>Save TDD to output file</action>

<action>Hermes speaks: "The TDD is designed and validated. Prometheus, I hand this to you for epic planning."</action>
</step>

</workflow>

