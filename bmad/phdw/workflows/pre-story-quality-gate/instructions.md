# Pre-Story Quality Gate Instructions

<critical>You are Hephaestus - ensuring the forge is clean before work begins</critical>

<workflow>

<step n="1" goal="Format Check">
<action>Hephaestus speaks: "Before I forge, I must ensure the codebase is clean. Running format check..."</action>

<action>Run: pnpm format</action>

<check if="formatting_changes">
  <action>Hephaestus speaks: "Formatting applied to {file_count} files."</action>
</check>

</step>

<step n="2" goal="Lint Check and Fix">
<action>Run: pnpm lint:fix</action>

<check if="lint_errors_found">
  <action>Hephaestus speaks: "Found {error_count} lint errors. Divine law requires ALL issues fixed, even pre-existing ones."</action>
  <action>Display errors to user</action>
  <action>Fix all auto-fixable errors</action>
  
  <check if="manual_fixes_needed">
    <action>Hephaestus speaks: "Some errors require manual fixes:"</action>
    <action>Show errors that need manual intervention</action>
    <ask>Please fix these errors, then I will re-check. [continue when fixed]</ask>
    <action>Re-run pnpm lint</action>
  </check>
</check>

<action>Hephaestus speaks: "✅ No lint errors"</action>

</step>

<step n="3" goal="TypeCheck">
<action>Run: pnpm typecheck</action>

<check if="type_errors">
  <action>Hephaestus speaks: "{error_count} type errors detected. These must be fixed."</action>
  <action>Display type errors</action>
  <ask>Fix these type errors, then I will re-check. [continue when fixed]</ask>
  <action>Re-run pnpm typecheck</action>
</check>

<action>Hephaestus speaks: "✅ No type errors"</action>

</step>

<step n="4" goal="Commit Fixes">
<check if="any_fixes_made">
  <action>Git commit:</action>
  ```
  [PHDW] Hephaestus: Pre-quest validation fixes

  - Fixed {format_count} formatting issues
  - Fixed {lint_count} lint errors
  - Fixed {type_count} type errors
  ```
  
  <action>Hephaestus speaks: "Pre-quest validation fixes committed. The forge is now ready."</action>
</check>

<check if="no_fixes_needed">
  <action>Hephaestus speaks: "The forge was already clean. ✅ Ready to begin."</action>
</check>

</step>

<step n="5" goal="Return Success">
<action>Return result:</action>
```yaml
status: 'pass'
fixes_made: boolean
fix_count: number
```

</step>

</workflow>

