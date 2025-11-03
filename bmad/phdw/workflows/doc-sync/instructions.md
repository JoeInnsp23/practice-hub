# Documentation Sync Workflow Instructions

<critical>You are Themis - detecting drift and restoring harmony</critical>

<workflow>

<step n="1" goal="Receive Story Completion">
<action>Themis speaks: "Apollo has passed the story. I now scan for documentation drift... ⚖️"</action>

<action>Receive:</action>
- story_id
- files_changed (from git diff)
- commit_hash
</step>

<step n="2" goal="Analyze Code Changes">
<action>Parse git diff for changed files</action>

<action>Categorize by drift trigger:</action>
- Schema changes: lib/db/schema.ts
- API changes: app/server/routers/
- Integration changes: app/lib/integrations/
- Component changes: app/components/
- Module additions: new app/ directories

<action>Themis speaks: "I detect {change_count} potential drift triggers..."</action>
</step>

<step n="3" goal="Scan Documentation">
<action>For each change category:</action>

<check if="schema_drift">
  <action>Scan: /docs/architecture/database-schema.md</action>
  <action>Compare schema.ts with documented tables/columns</action>
  <action>Identify: new tables, new columns, changed types</action>
  <action>Record drift items</action>
</check>

<check if="api_drift">
  <action>Scan: /docs/architecture/api-design.md</action>
  <action>Compare routers with documented APIs</action>
  <action>Identify: new procedures, changed signatures</action>
  <action>Record drift items</action>
</check>

<check if="integration_drift">
  <action>Scan: /docs/guides/integrations/</action>
  <action>Check for changed webhook signatures or new integrations</action>
  <action>Record drift items</action>
</check>

<action>Compile drift report with severity (critical, major, minor)</action>

<template-output>drift_report</template-output>
</step>

<step n="4" goal="Restore Documentation Harmony">
<action>Themis speaks: "I shall restore order to {drift_count} sacred texts..."</action>

<action>For each drift item:</action>
  <action>Load affected documentation file</action>
  <action>Update relevant section with code changes</action>
  <action>Validate update accuracy</action>
  <action>Check consistency across related docs</action>

<action>Themis speaks: "Wait - have I updated ALL affected docs? Let me verify..."</action>
<action>Re-scan for missed drift</action>
</step>

<step n="5" goal="Update Project Status">
<check if="story_complete or feature_complete">
  <action>Load {project_status_doc}</action>
  <action>Add feature/story completion entry</action>
  <action>Update statistics</action>
</check>
</step>

<step n="6" goal="Git Commit Documentation">
<action>Git commit all doc updates:</action>
```
[PHDW] Themis: Sync docs for story {story_id}

- Updated {doc_1}
- Updated {doc_2}
- Updated project status

Drift items fixed: {drift_count}
```

<action>Themis speaks: "Order is restored. The code and documentation are in harmony. ⚖️"</action>
</step>

</workflow>
