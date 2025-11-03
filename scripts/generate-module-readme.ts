/**
 * Generate module README from code analysis
 *
 * Usage: tsx scripts/generate-module-readme.ts <module-path>
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface _ModuleInfo {
  name: string;
  path: string;
  routes: string[];
  routers: string[];
  tables: string[];
}

function findRoutes(modulePath: string): string[] {
  const routes: string[] = [];

  function walk(dir: string, basePath = "") {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

        const fullPath = join(dir, entry.name);
        const routePath = `${basePath}/${entry.name}`;

        if (entry.isDirectory()) {
          walk(fullPath, routePath);
        } else if (entry.name === "page.tsx") {
          routes.push(basePath || "/");
        }
      }
    } catch {}
  }

  walk(modulePath);
  return routes.sort();
}

function findRelatedRouters(moduleName: string): string[] {
  const routersDir = "app/server/routers";
  const related: string[] = [];

  try {
    const files = readdirSync(routersDir);
    const keywords = getModuleKeywords(moduleName);

    for (const file of files) {
      if (!file.endsWith(".ts")) continue;
      const content = readFileSync(join(routersDir, file), "utf-8");
      if (
        keywords.some((k) => content.toLowerCase().includes(k.toLowerCase()))
      ) {
        related.push(file.replace(".ts", ""));
      }
    }
  } catch {}

  return related;
}

function findRelatedTables(moduleName: string): string[] {
  try {
    const schema = readFileSync("lib/db/schema.ts", "utf-8");
    const tableMatches = schema.match(/export const (\w+) = pgTable/g) || [];
    const tables = tableMatches.map((m) => m.match(/const (\w+)/)?.[1] || "");

    const keywords = getModuleKeywords(moduleName);
    return tables.filter((table) =>
      keywords.some((k) => table.toLowerCase().includes(k.toLowerCase())),
    );
  } catch {
    return [];
  }
}

function getModuleKeywords(moduleName: string): string[] {
  const map: Record<string, string[]> = {
    "client-hub": [
      "client",
      "contact",
      "director",
      "psc",
      "service",
      "compliance",
      "document",
    ],
    "proposal-hub": [
      "proposal",
      "lead",
      "pipeline",
      "pricing",
      "onboarding",
      "template",
    ],
    "practice-hub": [
      "dashboard",
      "activity",
      "notification",
      "message",
      "calendar",
    ],
    admin: [
      "user",
      "department",
      "invitation",
      "portal",
      "feedback",
      "kyc",
      "staff",
    ],
    "client-portal": [
      "client_portal",
      "portal",
      "onboarding_session",
      "questionnaire",
    ],
  };
  return map[moduleName] || [moduleName.replace(/-/g, "_")];
}

function guessModuleType(path: string): string {
  if (path.includes("client-hub")) return "Hub Module";
  if (path.includes("proposal-hub")) return "Hub Module";
  if (path.includes("practice-hub")) return "Hub Module";
  if (path.includes("admin")) return "Admin Panel";
  if (path.includes("client-portal")) return "Client Portal";
  return "Module";
}

function main() {
  const modulePath = process.argv[2];
  if (!modulePath) {
    console.error("Usage: tsx generate-module-readme.ts <module-path>");
    process.exit(1);
  }

  const name = modulePath.split("/").pop() || "";
  const routes = findRoutes(modulePath);
  const routers = findRelatedRouters(name);
  const tables = findRelatedTables(name);

  const template = readFileSync(
    "docs/.templates/MODULE_README_TEMPLATE.md",
    "utf-8",
  );

  let content = template
    .replace(/\[Module Name\]/g, name)
    .replace(/\[path\/to\/module\]/g, modulePath)
    .replace(
      /\[Hub Module \| Admin Panel \| Client Portal \| Integration Library\]/g,
      guessModuleType(modulePath),
    )
    .replace(/\[Active \| In Development \| Deprecated\]/g, "Active")
    .replace(/\[Date\]/g, new Date().toISOString().split("T")[0]);

  // Routes table
  if (routes.length > 0) {
    const routesTable = routes
      .map((r) => `| \`/${name}${r}\` | [Auto-detected] | Member |`)
      .join("\n");
    content = content.replace(
      /\| Route \| Description \| Access Level \|\n\|-------|-------------|-------------\|\n[^\n]*/,
      `| Route | Description | Access Level |\n|-------|-------------|-------------|\n${routesTable}`,
    );
  }

  // Routers table
  if (routers.length > 0) {
    const routersTable = routers
      .map((r) => `| \`${r}.ts\` | [Auto-detected] | See file |`)
      .join("\n");
    content = content.replace(
      /\| Router \| Procedures \| Purpose \|\n\|--------|-----------|--------\|\n[^\n]*/,
      `| Router | Procedures | Purpose |\n|--------|-----------|--------|\n${routersTable}`,
    );
  }

  // Tables
  if (tables.length > 0) {
    const tablesTable = tables
      .map((t) => `| \`${t}\` | [Auto-detected] | ✅ tenantId | See schema |`)
      .join("\n");
    content = content.replace(
      /\| Table \| Purpose \| Multi-Tenant \| Client-Isolated \|\n\|-------|---------|--------------|----------------\|\n[^\n]*/,
      `| Table | Purpose | Multi-Tenant | Client-Isolated |\n|-------|---------|--------------|----------------|\n${tablesTable}`,
    );
  }

  console.log(content);
}

main();
