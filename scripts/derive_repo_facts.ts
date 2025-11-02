#!/usr/bin/env tsx
/**
 * Repository Facts Derivation Script
 * Scans codebase and generates docs/dev/repo-facts.json
 * NO HARD-CODED COUNTS - all data derived from filesystem/AST
 */

import { globSync } from "glob";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

interface RepoFacts {
	generated: string;
	routes: {
		total: number;
		byModule: Record<string, number>;
		files: string[];
	};
	routers: {
		total: number;
		procedures: {
			total: number;
			queries: number;
			mutations: number;
		};
		files: Array<{
			path: string;
			procedures: string[];
		}>;
	};
	database: {
		tables: number;
		enums: number;
		views: number;
		tableNames: string[];
		enumNames: string[];
		viewNames: string[];
	};
	components: {
		total: number;
		ui: number;
		custom: number;
		files: string[];
	};
	envVars: {
		total: number;
		required: string[];
		optional: string[];
	};
	modules: string[];
}

/**
 * Scan app directory for page.tsx route files
 */
function scanRoutes(): RepoFacts["routes"] {
	const files = globSync("app/**/page.tsx", {
		ignore: ["**/node_modules/**", "**/.next/**"],
	});

	const byModule: Record<string, number> = {};

	for (const file of files) {
		const module = file.split("/")[1] || "root";
		byModule[module] = (byModule[module] || 0) + 1;
	}

	return {
		total: files.length,
		byModule,
		files: files.sort(),
	};
}

/**
 * Parse tRPC routers and extract procedures
 */
function scanRouters(): RepoFacts["routers"] {
	const files = globSync("app/server/routers/**/*.ts", {
		ignore: ["**/*.test.ts", "**/*.spec.ts"],
	});

	let totalProcedures = 0;
	let queries = 0;
	let mutations = 0;
	const routerData: Array<{ path: string; procedures: string[] }> = [];

	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);

		const procedures: string[] = [];

		function visit(node: ts.Node) {
			// Look for .query( or .mutation( calls
			if (
				ts.isPropertyAccessExpression(node) &&
				(node.name.text === "query" || node.name.text === "mutation")
			) {
				// Find the property name (procedure name)
				let parent = node.parent;
				while (parent && !ts.isPropertyAssignment(parent)) {
					parent = parent.parent;
				}

				if (parent && ts.isPropertyAssignment(parent)) {
					const name = parent.name.getText(sourceFile);
					procedures.push(name);
					totalProcedures++;

					if (node.name.text === "query") queries++;
					else mutations++;
				}
			}

			ts.forEachChild(node, visit);
		}

		visit(sourceFile);

		if (procedures.length > 0) {
			routerData.push({
				path: file,
				procedures: procedures.sort(),
			});
		}
	}

	return {
		total: files.length,
		procedures: {
			total: totalProcedures,
			queries,
			mutations,
		},
		files: routerData,
	};
}

/**
 * Parse lib/db/schema.ts for tables/enums/views
 */
function scanDatabase(): RepoFacts["database"] {
	const schemaPath = "lib/db/schema.ts";
	const content = fs.readFileSync(schemaPath, "utf-8");

	// Parse with TypeScript AST
	const sourceFile = ts.createSourceFile(
		schemaPath,
		content,
		ts.ScriptTarget.Latest,
		true,
	);

	const tableNames: string[] = [];
	const enumNames: string[] = [];

	function visit(node: ts.Node) {
		// Look for pgTable( calls
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "pgTable"
		) {
			// First argument is table name
			if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
				tableNames.push(node.arguments[0].text);
			}
		}

		// Look for pgEnum( calls
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "pgEnum"
		) {
			if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
				enumNames.push(node.arguments[0].text);
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	// Scan drizzle/*.sql for views
	const sqlFiles = globSync("drizzle/*.sql");
	const viewNames: string[] = [];

	for (const file of sqlFiles) {
		const content = fs.readFileSync(file, "utf-8");
		const viewMatches = content.matchAll(
			/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+["']?(\w+)["']?/gi,
		);

		for (const match of viewMatches) {
			viewNames.push(match[1]);
		}
	}

	return {
		tables: tableNames.length,
		enums: enumNames.length,
		views: viewNames.length,
		tableNames: tableNames.sort(),
		enumNames: enumNames.sort(),
		viewNames: viewNames.sort(),
	};
}

/**
 * Scan components directory for TypeScript/TSX files
 */
function scanComponents(): RepoFacts["components"] {
	const files = globSync("components/**/*.{tsx,ts}", {
		ignore: ["**/*.test.tsx", "**/*.spec.tsx"],
	});

	const uiFiles = files.filter((f) => f.startsWith("components/ui/"));
	const customFiles = files.filter((f) => !f.startsWith("components/ui/"));

	return {
		total: files.length,
		ui: uiFiles.length,
		custom: customFiles.length,
		files: files.sort(),
	};
}

/**
 * Scan for process.env.* usage
 */
function scanEnvVars(): RepoFacts["envVars"] {
	const files = globSync("{app,lib,scripts}/**/*.{ts,tsx}", {
		ignore: ["**/node_modules/**", "**/.next/**", "**/*.test.ts"],
	});

	const envVars = new Set<string>();

	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		const matches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);

		for (const match of matches) {
			envVars.add(match[1]);
		}
	}

	// Classify as required/optional based on .env.example
	const envExample = fs.existsSync(".env.example")
		? fs.readFileSync(".env.example", "utf-8")
		: "";

	const required: string[] = [];
	const optional: string[] = [];

	for (const varName of Array.from(envVars).sort()) {
		// Check if commented as optional in .env.example
		const isOptional =
			envExample.includes("# Optional") &&
			envExample.split("# Optional")[1]?.includes(varName);

		if (isOptional) {
			optional.push(varName);
		} else {
			required.push(varName);
		}
	}

	return {
		total: envVars.size,
		required,
		optional,
	};
}

/**
 * Detect modules from app/* directories
 */
function scanModules(): string[] {
	const dirs = globSync("app/*/", {
		ignore: ["app/api/", "app/server/"],
	});

	return dirs
		.map((d) => d.replace("app/", "").replace("/", ""))
		.filter((d) => d !== "(auth)")
		.sort();
}

/**
 * Main execution
 */
async function main() {
	console.log("📊 Deriving repository facts...\n");

	const facts: RepoFacts = {
		generated: new Date().toISOString(),
		routes: scanRoutes(),
		routers: scanRouters(),
		database: scanDatabase(),
		components: scanComponents(),
		envVars: scanEnvVars(),
		modules: scanModules(),
	};

	// Ensure output directory
	const outDir = "docs/dev";
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}

	// Write JSON
	const outPath = path.join(outDir, "repo-facts.json");
	fs.writeFileSync(outPath, JSON.stringify(facts, null, 2));

	console.log("✅ Facts generated:");
	console.log(`   Routes: ${facts.routes.total}`);
	console.log(`   Routers: ${facts.routers.total}`);
	console.log(
		`   Procedures: ${facts.routers.procedures.total} (${facts.routers.procedures.queries}q / ${facts.routers.procedures.mutations}m)`,
	);
	console.log(`   Tables: ${facts.database.tables}`);
	console.log(`   Enums: ${facts.database.enums}`);
	console.log(`   Views: ${facts.database.views}`);
	console.log(`   Components: ${facts.components.total}`);
	console.log(`   Env Vars: ${facts.envVars.total}`);
	console.log(`   Modules: ${facts.modules.join(", ")}`);
	console.log(`\n📄 Output: ${outPath}`);
}

main().catch(console.error);
