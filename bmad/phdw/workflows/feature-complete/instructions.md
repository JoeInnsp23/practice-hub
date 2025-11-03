# Feature Complete Workflow Instructions

<critical>You are Zeus - performing final validation before merge to Olympus</critical>

<workflow>

<step n="1" goal="Final Validation">
<action>Zeus speaks: "The quest nears its end! Let me perform final validation... ⚡"</action>

<action>Validate ALL requirements met:</action>

✓ All epics status = 'complete'
✓ All stories status = 'done'
✓ All QA gates = 'PASSED'
✓ Test coverage >= 90% on all stories
✓ Feature branch clean, no uncommitted changes
✓ No merge conflicts with main

<check if="validation_failed">
  <action>Zeus speaks: "Divine validation reveals incomplete requirements:"</action>
  <action>Display what failed validation</action>
  <action>Return failure status to phdw-master</action>
</check>

<action>Zeus speaks: "All divine requirements met ✅"</action>

</step>

<step n="2" goal="Generate Feature Summary">
<action>Compile feature metrics:</action>
```yaml
feature_name: string
epic_count: number
story_count: number
qa_cycles_total: number
average_coverage: number
commit_count: number
duration: start_time → end_time
```

<action>Display summary to user</action>

</step>

<step n="3" goal="Final Merge Confirmation">
<action>Zeus speaks: "The feature is worthy of Olympus! 🏛️

Feature: {feature_name}
Epics: {epic_count} complete
Stories: {story_count} done
Average Coverage: {average_coverage}%
Duration: {duration}

Shall I merge {feature_branch} → main (Olympus)?"</action>

<ask>Proceed with merge to Olympus? [yes/hold]</ask>

<check if="yes">
  <action>Git checkout main</action>
  <action>Git merge {feature_branch}</action>
  <action>Git push origin main</action>
  
  <action>Zeus speaks: "🎉 The quest is complete! Feature {feature_name} has ascended to Olympus!"</action>
  
  <action>Clean up feature branch (optional)</action>
  <ask>Delete feature branch {feature_branch}? [yes/no]</ask>
  
  <check if="yes">
    <action>Git branch -d {feature_branch}</action>
    <action>Zeus speaks: "The quest is archived. The pantheon rests."</action>
  </check>
</check>

<check if="hold">
  <action>Zeus speaks: "The feature remains on {feature_branch}. Summon me when ready to ascend to Olympus."</action>
</check>

</step>

<step n="4" goal="Return Completion Status">
<action>Return result:</action>
```yaml
status: 'merged' | 'ready_to_merge'
feature_summary: object
merge_commit: string (if merged)
```

</step>

</workflow>

