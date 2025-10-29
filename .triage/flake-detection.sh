#!/bin/bash

echo "### A-3: Flake Detection" >> docs/quality/test-triage/triage-log.md
echo "" >> docs/quality/test-triage/triage-log.md
echo "**Method**: Run each failing file 3x to detect non-deterministic behavior" >> docs/quality/test-triage/triage-log.md
echo "" >> docs/quality/test-triage/triage-log.md

while IFS= read -r file; do
  echo "Testing: $file"
  
  results=()
  for i in {1..3}; do
    pnpm test "$file" --run --pool=threads --poolOptions.threads.singleThread=true --reporter=dot 2>&1 > /dev/null
    if [ $? -eq 0 ]; then
      results+=("PASS")
    else
      results+=("FAIL")
    fi
  done
  
  # Check if results are consistent
  if [[ "${results[0]}" != "${results[1]}" || "${results[1]}" != "${results[2]}" ]]; then
    echo "  ⚠️  FLAKY: ${results[*]}"
    echo "- **FLAKY**: \`$file\` (${results[0]}, ${results[1]}, ${results[2]})" >> docs/quality/test-triage/triage-log.md
  else
    echo "  ✓ DETERMINISTIC: ${results[0]}"
    echo "- **DETERMINISTIC**: \`$file\` (${results[0]})" >> docs/quality/test-triage/triage-log.md
  fi
done < .triage/failing-files.txt

echo "" >> docs/quality/test-triage/triage-log.md
echo "**Flake detection complete**. See results above." >> docs/quality/test-triage/triage-log.md
echo "" >> docs/quality/test-triage/triage-log.md

