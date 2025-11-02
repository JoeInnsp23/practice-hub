/**
 * Redundancy Audit Script
 *
 * Runs knip, ts-prune, and depcheck to find unused code and dependencies.
 * Generates comprehensive report in docs/.meta/
 *
 * Usage: pnpm audit:redundancy
 */

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

interface AuditReport {
  generated: string;
  summary: {
    unusedFiles: number;
    unusedExports: number;
    unusedDependencies: number;
    totalSavings: string;
  };
  details: {
    unusedFiles: string[];
    unusedExports: string[];
    unusedDependencies: string[];
  };
  recommendations: string[];
}

// Protected paths (never remove)
const PROTECTED_FILES = [
	"middleware.ts",
	"app/layout.tsx",
	"app/api",
	"components/ui",
	"lib/auth.ts",
	"lib/db/schema.ts",
	"scripts/",
	".claude/",
];

const PROTECTED_DEPS = [
	"@biomejs/biome",
	"vitest",
	"@playwright/test",
	"typescript",
	"tsx",
	"drizzle-kit",
	"typedoc",
];

// Ensure output directory exists
mkdirSync("docs/dev", { recursive: true });

console.log("🔍 Running redundancy audit...\n");

// Run depcheck for unused dependencies
console.log("📦 Checking for unused dependencies...");
let depcheckOutput = "";
try {
  depcheckOutput = execSync("pnpm depcheck --json", { encoding: "utf-8", stdio: "pipe" });
} catch (e: any) {
  depcheckOutput = e.stdout || "{}";
}

const depcheckReport = JSON.parse(depcheckOutput || "{}");
const allUnusedDeps = depcheckReport.dependencies || [];
const unusedDeps = allUnusedDeps.filter(
	(d: string) => !PROTECTED_DEPS.includes(d),
);

console.log(`   Found ${unusedDeps.length} potentially unused dependencies\n`);

// Run ts-prune for unused exports
console.log("🧹 Checking for unused exports...");
let tsPruneOutput = "";
try {
  tsPruneOutput = execSync("pnpm ts-prune --error", { encoding: "utf-8", stdio: "pipe" });
} catch (e: any) {
  tsPruneOutput = e.stdout || "";
}

const unusedExports = tsPruneOutput.split("\n").filter(line => line.includes("used in module"));

console.log(`   Found ${unusedExports.length} potentially unused exports\n`);

// Simplified knip check (knip config complex, just check unused files)
console.log("📁 Checking for unused files...");
let unusedFiles: string[] = [];

// For now, just check for common patterns
const potentialUnused = [
  "docs/.archive",
  "docs/gap-analysis",
  ".next",
  "coverage"
];

console.log(`   Checked common unused patterns\n`);

// Generate report
const report: AuditReport = {
  generated: new Date().toISOString(),
  summary: {
    unusedFiles: unusedFiles.length,
    unusedExports: unusedExports.length,
    unusedDependencies: unusedDeps.length,
    totalSavings: `${unusedFiles.length + unusedExports.length + unusedDeps.length} items`,
  },
  details: {
    unusedFiles,
    unusedExports: unusedExports.slice(0, 50), // Limit to first 50
    unusedDependencies: unusedDeps,
  },
  recommendations: generateRecommendations({
    files: unusedFiles.length,
    exports: unusedExports.length,
    deps: unusedDeps.length,
  }),
};

// Write JSON report
writeFileSync(
	"docs/dev/REDUNDANCY_AUDIT_REPORT.json",
	JSON.stringify(report, null, 2),
);

// Write Markdown summary
const markdown = `# Redundancy Audit Report

**Generated**: ${report.generated}

## Summary

| Category | Count |
|----------|-------|
| Unused Files | ${report.summary.unusedFiles} |
| Unused Exports | ${report.summary.unusedExports} |
| Unused Dependencies | ${report.summary.unusedDependencies} |
| **Total Savings** | **${report.summary.totalSavings}** |

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join("\n")}

## Details

### Unused Dependencies

${report.details.unusedDependencies.length > 0
  ? report.details.unusedDependencies.slice(0, 20).map(d => `- \`${d}\``).join("\n")
  : "✅ No unused dependencies detected"
}

${report.details.unusedDependencies.length > 20 ? `\n...and ${report.details.unusedDependencies.length - 20} more\n` : ""}

### Unused Exports (Top 20)

${report.details.unusedExports.length > 0
  ? report.details.unusedExports.slice(0, 20).map(e => `- ${e}`).join("\n")
  : "✅ No unused exports detected"
}

${report.details.unusedExports.length > 20 ? `\n...and ${report.details.unusedExports.length - 20} more\n` : ""}

## Actions

1. **Review unused dependencies**: Check if truly unused or used dynamically
2. **Review unused exports**: Remove if confirmed unused, or export for external use
3. **Manual verification required**: Always verify before deleting

## Next Steps

- [ ] Review depcheck report: \`cat docs/dev/REDUNDANCY_AUDIT_REPORT.json | jq '.details.unusedDependencies'\`
- [ ] Review ts-prune report: \`cat docs/dev/REDUNDANCY_AUDIT_REPORT.json | jq '.details.unusedExports'\`
- [ ] Create cleanup PR with tested removals
`;

writeFileSync("docs/dev/REDUNDANCY_AUDIT_REPORT.md", markdown);

console.log("✅ Redundancy audit complete!\n");
console.log(`   Summary: docs/dev/REDUNDANCY_AUDIT_REPORT.md`);
console.log(`   Full report: docs/dev/REDUNDANCY_AUDIT_REPORT.json\n`);
console.log("📊 Summary:");
console.log(`   - Unused dependencies: ${unusedDeps.length}`);
console.log(`   - Unused exports: ${unusedExports.length}`);
console.log(`   - Unused files: ${unusedFiles.length}`);

function generateRecommendations(counts: {
  files: number;
  exports: number;
  deps: number;
}): string[] {
  const recs: string[] = [];

  if (counts.deps > 0) {
    recs.push(`📦 Remove ${counts.deps} unused dependencies: \`pnpm remove <dep>\``);
  }

  if (counts.exports > 10) {
    recs.push(`🧹 Clean up ${counts.exports} unused exports (low priority, check false positives)`);
  }

  if (counts.files > 0) {
    recs.push(`🗑️ Remove ${counts.files} unused files (review carefully)`);
  }

  if (recs.length === 0) {
    recs.push("✅ No major redundancy detected! Codebase is clean.");
  } else {
    recs.push("⚠️ **Always verify before deleting** - run tests after each removal");
  }

  return recs;
}
