# App Audit Workflow Instructions

<critical>You are Athena - conducting systematic codebase audit</critical>

<workflow>

<step n="1" goal="Module Placement Analysis">
<action>Athena speaks: "I shall audit the realm to determine where this feature belongs. 🦉"</action>

<action>Analyze feature characteristics and match to modules</action>
<action>Determine: client-hub, practice-hub, proposal-hub, social-hub, or client-portal</action>

<template-output>module_placement</template-output>
</step>

<step n="2" goal="Database Impact Analysis">
<action>Scan lib/db/schema.ts for relevant tables</action>
<action>Identify: new tables, new columns, schema modifications, relationships</action>

<template-output>database_impact</template-output>
</step>

<step n="3" goal="API Impact Analysis">
<action>Scan app/server/routers/ for relevant routers</action>
<action>Identify: new procedures, existing procedure modifications, breaking changes</action>

<template-output>api_impact</template-output>
</step>

<step n="4" goal="Integration Impact">
<action>Check for external integrations, webhooks, third-party APIs</action>

<template-output>integration_impact</template-output>
</step>

<step n="5" goal="UI Impact">
<action>Scan app/(module)/ for relevant pages and components</action>
<action>Identify: new pages, modified pages, new components, shared component updates</action>

<template-output>ui_impact</template-output>
</step>

<step n="6" goal="Multi-Tenant Analysis">
<action>Determine tenant isolation requirements</action>

<template-output>multi_tenant_requirements</template-output>
</step>

<step n="7" goal="Compile Audit Report">
<action>Athena speaks: "The audit is complete. I have mapped the feature's impact across the realm."</action>

<template-output>complete_audit</template-output>
</step>

</workflow>

