/**
 * Validate frontmatter in documentation files
 *
 * Checks that all docs have valid YAML frontmatter with required fields.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface FrontmatterError {
  file: string;
  error: string;
}

function validateFrontmatter(file: string): FrontmatterError[] {
  const content = readFileSync(file, "utf-8");
  const errors: FrontmatterError[] = [];

  // Allow files without frontmatter in certain directories
  if (
    file.includes("/reference/typescript/") ||
    file.includes("/.archive/") ||
    file.includes("/.meta/") ||
    file.includes("README.md")
  ) {
    return errors;
  }

  // Check if file has frontmatter
  if (!content.startsWith("---\n")) {
    errors.push({ file, error: "Missing frontmatter" });
    return errors;
  }

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    errors.push({ file, error: "Invalid frontmatter format" });
    return errors;
  }

  const frontmatter = frontmatterMatch[1];
  const lines = frontmatter.split("\n");

  // Required fields for stubs
  const requiredFields = ["status", "created", "category"];
  const fields: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      fields[match[1]] = match[2];
    }
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!fields[field]) {
      errors.push({ file, error: `Missing required field: ${field}` });
    }
  }

  // Validate status field
  const validStatuses = ["draft", "active", "archived", "deprecated"];
  if (fields.status && !validStatuses.includes(fields.status)) {
    errors.push({
      file,
      error: `Invalid status: ${fields.status}. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // Validate date format (YYYY-MM-DD)
  if (fields.created && !/^\d{4}-\d{2}-\d{2}$/.test(fields.created)) {
    errors.push({
      file,
      error: `Invalid date format: ${fields.created}. Must be YYYY-MM-DD`,
    });
  }

  return errors;
}

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(current: string) {
    try {
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (
          ["node_modules", ".archive", ".meta", "typescript"].includes(
            entry.name
          )
        ) {
          continue;
        }

        const fullPath = join(current, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
          files.push(fullPath);
        }
      }
    } catch {}
  }

  walk(dir);
  return files;
}

function main() {
  console.log("Validating frontmatter in documentation files...\n");

  const files = findMarkdownFiles("docs");
  let totalErrors = 0;
  const allErrors: FrontmatterError[] = [];

  for (const file of files) {
    const errors = validateFrontmatter(file);
    if (errors.length > 0) {
      totalErrors += errors.length;
      allErrors.push(...errors);
    }
  }

  if (totalErrors > 0) {
    console.error(`❌ Found ${totalErrors} frontmatter errors:\n`);
    for (const error of allErrors) {
      console.error(`  ${error.file}: ${error.error}`);
    }
    process.exit(1);
  } else {
    console.log(
      `✅ All ${files.length} documentation files have valid frontmatter`
    );
  }
}

main();
