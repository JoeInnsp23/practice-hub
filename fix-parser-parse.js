#!/usr/bin/env node
/**
 * Fix Parser.parse errors in test files
 *
 * The issue: tRPC's inputs[0] is typed as Parser (no .parse method)
 * At runtime: inputs[0] is a Zod schema (has .parse method)
 *
 * Solution: Cast inputs[0] as any in test files since we're testing schema behavior
 */

const fs = require("node:fs");
const path = require("node:path");

const files = [
  "__tests__/routers/invitations.test.ts",
  "__tests__/routers/reports.test.ts",
  "__tests__/routers/settings.test.ts",
  "__tests__/routers/taskTemplates.test.ts",
];

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, "utf8");

  // Pattern: somethingRouter._def.procedures.procedureName._def.inputs[0]?.parse(
  // Replace with: (somethingRouter._def.procedures.procedureName._def.inputs[0] as any)?.parse(
  // Match from Router. onwards to capture full expression
  const regex =
    /([\w]+Router\._def\.procedures\.[\w]+\._def\.inputs\[0\])\?\.parse\(/g;
  const matches = content.match(regex) || [];
  const fixCount = matches.length;

  if (fixCount > 0) {
    content = content.replace(regex, "($1 as any)?.parse(");
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ ${file}: Fixed ${fixCount} Parser.parse calls`);
    totalFixed += fixCount;
  } else {
    console.log(`⏭️  ${file}: No changes needed`);
  }
}

console.log(`\n🎉 Total fixed: ${totalFixed} Parser.parse calls`);
