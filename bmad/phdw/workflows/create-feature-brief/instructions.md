# Create Feature Brief Instructions

<critical>In Phase 1: Zeus guides manual brief creation</critical>
<critical>In Phase 2: Hermes will craft this automatically</critical>

<workflow>

<step n="1" goal="Capture Feature Overview">
<action>Zeus speaks: "Let us document this quest in a feature brief..."</action>

<ask>Feature Name (user-friendly title):</ask>
<ask>One-sentence description of what this feature does:</ask>
<ask>Why is this feature needed? (problem statement):</ask>
<ask>Who will use this feature? (target users):</ask>

</step>

<step n="2" goal="Technical Context">
<ask>Which practice-hub module? (client-hub, practice-hub, proposal-hub, etc.):</ask>
<ask>Does this require database schema changes? If yes, describe:</ask>
<ask>Does this require new tRPC procedures? If yes, list:</ask>
<ask>Does this require new UI components? If yes, list:</ask>
<ask>Is this multi-tenant? (staff-only, client-portal, both):</ask>

</step>

<step n="3" goal="Requirements">
<ask>List key requirements (one per line):</ask>
<action>Capture all requirements as bullet list</action>

<ask>Acceptance criteria (how will we know it's done?):</ask>
<action>Capture acceptance criteria</action>

</step>

<step n="4" goal="Multi-Tenant Considerations">
<ask>Tenant isolation requirements:</ask>
- [ ] All database queries must filter by tenantId
- [ ] Client portal features need tenantId + clientId
- [ ] UI must not show cross-tenant data
- [ ] Tests must validate isolation

<action>Document multi-tenant requirements</action>

</step>

<step n="5" goal="Testing Requirements">
<ask>Specific tests needed:</ask>
- Unit tests for...
- Integration tests for...
- UI tests for...
- Security tests for...

<action>90% coverage is mandatory (divine law)</action>

</step>

<step n="6" goal="Generate Brief Document">
<action>Zeus speaks: "I shall compile this into a formal feature brief..."</action>

<template-output>feature_brief</template-output>

<action>Brief saved to: {feature_output_path}/feature-brief-{feature_id}.md</action>

<action>Zeus speaks: "The feature brief is complete. Review it, and we shall proceed."</action>

</step>

</workflow>

