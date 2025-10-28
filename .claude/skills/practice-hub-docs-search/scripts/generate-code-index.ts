/**
 * Generate code-index.yaml from JSDoc comments in TypeScript files
 *
 * Scans all TypeScript (.ts/.tsx) files in Practice Hub, extracts
 * function/type/component documentation, and builds code-index.yaml.
 *
 * Usage: pnpm docs:generate:code-index
 */

import fs from "node:fs";
import path from "node:path";

interface CodeEntry {
  name: string;
  description: string;
  file: string;
  line: number;
  type: "function" | "type" | "component" | "class";
  signature?: string;
  tags?: string[];
  [key: string]: unknown;
}

const rootDir = path.resolve(__dirname, "../../../..");

/**
 * Extract JSDoc comments from TypeScript files
 */
function extractTypeScriptDocs(filePath: string): CodeEntry[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const entries: CodeEntry[] = [];

  // Match JSDoc blocks followed by export statements
  const jsdocPattern =
    /\/\*\*\s*([\s\S]*?)\*\/\s*export\s+((?:type|function|const|default function|interface|class)\s+(\w+))/g;

  let match;
  while ((match = jsdocPattern.exec(content)) !== null) {
    const jsdocText = match[1];
    const declaration = match[2];
    const name = match[3];

    // Get line number
    const lineNum = content.substring(0, match.index).split("\n").length;

    // Extract description (first line after /** that isn't a tag)
    const descMatch = jsdocText.match(/^\s*\*\s*(.+?)(?=\n|$)/m);
    const description = descMatch ? descMatch[1].trim() : "";

    // Detect type
    let type: "function" | "type" | "component" | "class" = "function";
    if (declaration.includes("type ") || declaration.includes("interface "))
      type = "type";
    if (declaration.includes("class ")) type = "class";
    if (
      declaration.includes("function") &&
      (filePath.includes("app/") || filePath.includes("components/"))
    ) {
      type = "component";
    }

    entries.push({
      name,
      description,
      file: path.relative(rootDir, filePath),
      line: lineNum,
      type,
      signature: declaration.split("\n")[0],
    });
  }

  return entries;
}

/**
 * Recursively find all TypeScript files
 */
function findSourceFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;

    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      // Skip common ignored directories
      if (
        [
          "node_modules",
          ".git",
          "dist",
          "build",
          ".next",
          ".archive",
          "__tests__",
          "coverage",
        ].includes(entry.name)
      ) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Build YAML string from entries
 */
function buildYaml(entries: CodeEntry[]): string {
  const lines: string[] = [
    "# Practice Hub Code Index v1.0",
    "# Auto-generated from JSDoc comments in TypeScript files",
    `# Generated: ${new Date().toISOString()}`,
    "",
    "functions:",
  ];

  const functions = entries.filter((e) => e.type === "function");
  const types = entries.filter((e) => e.type === "type");
  const components = entries.filter((e) => e.type === "component");
  const classes = entries.filter((e) => e.type === "class");

  // Functions section
  for (const entry of functions) {
    lines.push(`  ${entry.name}:`);
    lines.push(
      `    description: "${entry.description || "No description available"}"`,
    );
    lines.push(`    file: "${entry.file}"`);
    lines.push(`    line: ${entry.line}`);
    lines.push(`    type: "${entry.type}"`);
    if (entry.signature) {
      lines.push(`    signature: "${entry.signature.replace(/"/g, '\\"')}"`);
    }
  }

  // Types section
  if (types.length > 0) {
    lines.push("");
    lines.push("types:");
    for (const entry of types) {
      lines.push(`  ${entry.name}:`);
      lines.push(
        `    description: "${entry.description || "No description available"}"`,
      );
      lines.push(`    file: "${entry.file}"`);
      lines.push(`    line: ${entry.line}`);
      lines.push(`    type: "${entry.type}"`);
      if (entry.signature) {
        lines.push(`    signature: "${entry.signature.replace(/"/g, '\\"')}"`);
      }
    }
  }

  // Components section
  if (components.length > 0) {
    lines.push("");
    lines.push("components:");
    for (const entry of components) {
      lines.push(`  ${entry.name}:`);
      lines.push(
        `    description: "${entry.description || "No description available"}"`,
      );
      lines.push(`    file: "${entry.file}"`);
      lines.push(`    line: ${entry.line}`);
      lines.push(`    type: "${entry.type}"`);
      if (entry.signature) {
        lines.push(`    signature: "${entry.signature.replace(/"/g, '\\"')}"`);
      }
    }
  }

  // Classes section
  if (classes.length > 0) {
    lines.push("");
    lines.push("classes:");
    for (const entry of classes) {
      lines.push(`  ${entry.name}:`);
      lines.push(
        `    description: "${entry.description || "No description available"}"`,
      );
      lines.push(`    file: "${entry.file}"`);
      lines.push(`    line: ${entry.line}`);
      lines.push(`    type: "${entry.type}"`);
      if (entry.signature) {
        lines.push(`    signature: "${entry.signature.replace(/"/g, '\\"')}"`);
      }
    }
  }

  lines.push("");
  lines.push("metadata:");
  lines.push(`  version: "1.0"`);
  lines.push(`  generated: "${new Date().toISOString()}"`);
  lines.push(`  total_entries: ${entries.length}`);
  lines.push(`  functions: ${functions.length}`);
  lines.push(`  types: ${types.length}`);
  lines.push(`  components: ${components.length}`);
  lines.push(`  classes: ${classes.length}`);

  return lines.join("\n");
}

/**
 * Main entry point
 */
function main() {
  console.log("🔍 Scanning Practice Hub source files for JSDoc...");

  // Practice Hub single-repo structure
  const appFiles = findSourceFiles(path.join(rootDir, "app"), [".ts", ".tsx"]);
  const libFiles = findSourceFiles(path.join(rootDir, "lib"), [".ts", ".tsx"]);
  const componentFiles = findSourceFiles(path.join(rootDir, "components"), [
    ".ts",
    ".tsx",
  ]);

  console.log(`Found ${appFiles.length} files in app/`);
  console.log(`Found ${libFiles.length} files in lib/`);
  console.log(`Found ${componentFiles.length} files in components/`);

  const allFiles = [...appFiles, ...libFiles, ...componentFiles];
  const entries: CodeEntry[] = [];

  // Extract from TypeScript files
  for (const file of allFiles) {
    try {
      const docs = extractTypeScriptDocs(file);
      entries.push(...docs);
    } catch (e) {
      console.warn(`⚠️ Error parsing ${file}:`, (e as Error).message);
    }
  }

  console.log(`✅ Found ${entries.length} documented entries`);

  // Build YAML
  const yaml = buildYaml(entries);

  // Write to code-index.yaml
  const outputPath = path.join(__dirname, "../code-index.yaml");
  fs.writeFileSync(outputPath, yaml, "utf-8");

  console.log(`✅ Generated code-index.yaml (${outputPath})`);
  console.log(`📊 Summary:`);
  console.log(
    `   - Functions: ${entries.filter((e) => e.type === "function").length}`,
  );
  console.log(`   - Types: ${entries.filter((e) => e.type === "type").length}`);
  console.log(
    `   - Components: ${entries.filter((e) => e.type === "component").length}`,
  );
  console.log(
    `   - Classes: ${entries.filter((e) => e.type === "class").length}`,
  );
}

main();
