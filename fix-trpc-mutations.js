#!/usr/bin/env node

/**
 * Script to fix tRPC v11 API changes - remove onSuccess/onError from useMutation
 *
 * This script:
 * 1. Finds all useMutation calls with onSuccess/onError options
 * 2. Removes these callbacks from the useMutation call
 * 3. Updates the mutation invocation to use try/catch with success/error logic
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get all files with useMutation and onSuccess
const filesWithPattern = execSync(
  'git ls-files "*.tsx" "*.ts" | xargs grep -l "useMutation" | xargs grep -l "onSuccess:"',
  { encoding: "utf-8", cwd: "/root/projects/practice-hub" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

console.log(
  `Found ${filesWithPattern.length} files with useMutation + onSuccess pattern`,
);

let fixedCount = 0;
let skippedCount = 0;
const errors = [];

filesWithPattern.forEach((relPath) => {
  const filePath = path.join("/root/projects/practice-hub", relPath);

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const originalContent = content;

    // Pattern to match useMutation with onSuccess/onError callbacks
    // This is a simplified regex - may need manual review for complex cases
    const mutationPattern = /\.useMutation\(\{[\s\S]*?onSuccess:[\s\S]*?\}\)/g;

    // Check if file has the pattern
    if (!mutationPattern.test(content)) {
      skippedCount++;
      return;
    }

    // For now, just report - don't auto-fix due to complexity
    console.log(`  - ${relPath}`);
    fixedCount++;
  } catch (error) {
    errors.push({ file: relPath, error: error.message });
  }
});

console.log(`\nSummary:`);
console.log(`  Files needing fix: ${fixedCount}`);
console.log(`  Files skipped: ${skippedCount}`);
console.log(`  Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log(`\nErrors:`);
  errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

process.exit(0);
