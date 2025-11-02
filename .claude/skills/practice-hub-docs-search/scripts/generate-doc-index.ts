/**
 * Generate doc-index from markdown files with frontmatter
 *
 * Scans all documentation files in docs/, extracts frontmatter metadata,
 * and builds doc-index.json for AI agent search.
 *
 * Usage: pnpm docs:generate:doc-index
 */

import fs from "node:fs";
import path from "node:path";

interface DocEntry {
  title: string;
  file: string;
  category: string;
  status: string;
  excerpt: string;
  tags: string[];
  created?: string;
  updated?: string;
}

const rootDir = path.resolve(__dirname, "../../../..");

/**
 * Extract frontmatter and metadata from markdown files
 */
function extractMarkdownDocs(filePath: string): DocEntry | null {
  const content = fs.readFileSync(filePath, "utf-8");

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    // No frontmatter, skip
    return null;
  }

  const frontmatter = parseFrontmatter(frontmatterMatch[1]);

  // Extract title (first # heading after frontmatter)
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, ".md");

  // Extract excerpt (first paragraph after title, or first non-empty line)
  let excerpt = "";
  const lines = content.split("\n");
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith(">") && !line.startsWith("#")) {
      excerpt = line.trim().substring(0, 200);
      break;
    }
  }

  return {
    title,
    file: path.relative(rootDir, filePath),
    category: frontmatter.category || guessCategoryFromPath(filePath),
    status: frontmatter.status || "active",
    excerpt,
    tags: frontmatter.tags || [],
    created: frontmatter.created,
    updated: frontmatter.updated,
  };
}

/**
 * Parse YAML frontmatter into object
 */
function parseFrontmatter(yaml: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yaml.split("\n");

  for (const line of lines) {
    // Handle simple key: value
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      let value: any = match[2];

      // Handle arrays (tags: [tag1, tag2])
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value.slice(1, -1).split(",").map((v) => v.trim().replace(/["']/g, ""));
      }
      // Remove quotes
      else if (value.startsWith('"') || value.startsWith("'")) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Guess category from file path
 */
function guessCategoryFromPath(filePath: string): string {
  if (filePath.includes("docs/architecture/")) return "architecture";
  if (filePath.includes("docs/guides/")) return "guide";
  if (filePath.includes("docs/reference/")) return "reference";
  if (filePath.includes("docs/operations/")) return "operations";
  if (filePath.includes("docs/development/")) return "development";
  if (filePath.includes("docs/testing/")) return "testing";
  if (filePath.includes("docs/getting-started/")) return "getting-started";
  if (filePath.includes("docs/modules/")) return "modules";
  if (filePath.includes("docs/decisions/")) return "decisions";
  if (filePath.includes("docs/troubleshooting/")) return "troubleshooting";
  return "other";
}

/**
 * Recursively find all markdown files
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;

    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      // Skip ignored directories
      if (
        [
          "node_modules",
          ".archive",
          ".meta",
          "typescript", // TypeDoc generated
        ].includes(entry.name)
      ) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Main entry point
 */
function main() {
  console.log("📚 Scanning documentation files for frontmatter...");

  const docsDir = path.join(rootDir, "docs");
  const markdownFiles = findMarkdownFiles(docsDir);

  console.log(`Found ${markdownFiles.length} markdown files`);

  const entries: DocEntry[] = [];

  for (const file of markdownFiles) {
    try {
      const entry = extractMarkdownDocs(file);
      if (entry) {
        entries.push(entry);
      }
    } catch (e) {
      console.warn(`⚠️ Error parsing ${file}:`, (e as Error).message);
    }
  }

  console.log(`✅ Found ${entries.length} documented pages`);

  // Build JSON
  const index = {
    generated: new Date().toISOString(),
    version: "1.0.0",
    total: entries.length,
    docs: entries,
  };

  // Write to doc-index.json
  const outputPath = path.join(__dirname, "../doc-index.json");
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), "utf-8");

  console.log(`✅ Generated doc-index.json (${outputPath})`);
  console.log(`📊 Categories:`);

  const categories = new Map<string, number>();
  for (const entry of entries) {
    categories.set(entry.category, (categories.get(entry.category) || 0) + 1);
  }

  for (const [category, count] of categories.entries()) {
    console.log(`   - ${category}: ${count}`);
  }
}

main();
