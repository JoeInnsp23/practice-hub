#!/usr/bin/env tsx
/**
 * Module README Generator
 * Dynamically discovers modules and generates/updates their READMEs
 * Uses repo-facts.json for accurate route/feature counts
 */

import { globSync } from "glob";
import fs from "node:fs";
import path from "node:path";

interface RepoFacts {
	routes: {
		total: number;
		byModule: Record<string, number>;
	};
	routers: {
		files: Array<{
			path: string;
			procedures: string[];
		}>;
	};
	components: {
		files: string[];
	};
}

interface ModuleInfo {
	name: string;
	displayName: string;
	path: string;
	routes: number;
	routers: string[];
	components: string[];
	color: string;
	description: string;
}

const MODULE_METADATA: Record<
	string,
	{ displayName: string; color: string; description: string }
> = {
	"client-hub": {
		displayName: "Client Hub",
		color: "#3b82f6",
		description:
			"Complete client relationship management system with contacts, services, compliance tracking, and document management.",
	},
	"proposal-hub": {
		displayName: "Proposal Hub",
		color: "#10b981",
		description:
			"Lead management and proposal generation with comprehensive pricing calculator and PDF generation.",
	},
	"practice-hub": {
		displayName: "Practice Hub",
		color: "#6366f1",
		description:
			"Main dashboard and practice overview with quick actions and key metrics.",
	},
	admin: {
		displayName: "Admin Panel",
		color: "#f97316",
		description:
			"System administration including user management, KYC review queue, and portal links.",
	},
	"client-portal": {
		displayName: "Client Portal",
		color: "#8b5cf6",
		description:
			"Secure external client access with onboarding, document management, and service requests.",
	},
	"social-hub": {
		displayName: "Social Hub",
		color: "#ec4899",
		description: "Team collaboration features (in development).",
	},
	portal: {
		displayName: "Portal Management",
		color: "#14b8a6",
		description: "Portal categories and links management for client resources.",
	},
};

function loadRepoFacts(): RepoFacts {
	const factsPath = "docs/dev/repo-facts.json";
	if (!fs.existsSync(factsPath)) {
		throw new Error(`repo-facts.json not found. Run: pnpm docs:facts`);
	}
	return JSON.parse(fs.readFileSync(factsPath, "utf-8"));
}

function discoverModules(): string[] {
	const dirs = globSync("app/*/", {
		ignore: ["app/api/", "app/server/"],
	});

	return dirs
		.map((d) => d.replace("app/", "").replace("/", ""))
		.filter((d) => d !== "api" && d !== "server" && !d.startsWith("("))
		.sort();
}

function getModuleRouters(moduleName: string, facts: RepoFacts): string[] {
	// Find routers related to this module
	const moduleKeywords = moduleName.split("-");

	return facts.routers.files
		.filter((r) => {
			const routerPath = r.path.toLowerCase();
			return moduleKeywords.some((kw) => routerPath.includes(kw));
		})
		.map((r) => path.basename(r.path, ".ts"));
}

function getModuleComponents(moduleName: string, facts: RepoFacts): string[] {
	// Find components used in this module
	const moduleFiles = globSync(`app/${moduleName}/**/*.tsx`);
	const componentImports = new Set<string>();

	for (const file of moduleFiles) {
		const content = fs.readFileSync(file, "utf-8");
		const imports = content.matchAll(/from ['"]@\/components\/([^'"]+)['"]/g);

		for (const match of imports) {
			componentImports.add(match[1]);
		}
	}

	return Array.from(componentImports).sort();
}

function generateModuleInfo(moduleName: string, facts: RepoFacts): ModuleInfo {
	const metadata = MODULE_METADATA[moduleName] || {
		displayName: moduleName
			.split("-")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" "),
		color: "#6366f1",
		description: "Module description needed.",
	};

	return {
		name: moduleName,
		displayName: metadata.displayName,
		path: `app/${moduleName}`,
		routes: facts.routes.byModule[moduleName] || 0,
		routers: getModuleRouters(moduleName, facts),
		components: getModuleComponents(moduleName, facts),
		color: metadata.color,
		description: metadata.description,
	};
}

function generateReadmeContent(module: ModuleInfo): string {
	return `---
title: ${module.displayName}
description: ${module.description}
audience: dev
status: complete
generated: AI-GENERATED
---

# ${module.displayName}

${module.description}

<!-- BEGIN AI-GENERATED -->
## Module Statistics

- **Routes**: ${module.routes}
- **Routers**: ${module.routers.length}
- **Components Used**: ${module.components.length}
- **Module Path**: \`${module.path}\`
- **Theme Color**: \`${module.color}\`

**Last Updated**: ${new Date().toISOString().split("T")[0]}

### Related Routers

${module.routers.length > 0 ? module.routers.map((r) => `- \`${r}\``).join("\n") : "_No routers detected_"}

### Key Components

${module.components.length > 0 ? module.components.slice(0, 10).map((c) => `- \`${c}\``).join("\n") : "_No components detected_"}

${module.components.length > 10 ? `\n_... and ${module.components.length - 10} more_` : ""}
<!-- END AI-GENERATED -->

<!-- HUMAN-AUTHORED SECTION -->
## Features

_Add feature list here_

## User Guide

_Add user guide here_

## Development

_Add development notes here_
`;
}

async function main() {
	console.log("📚 Generating module READMEs...\n");

	// Load facts
	const facts = loadRepoFacts();

	// Discover modules
	const modules = discoverModules();
	console.log(`Found ${modules.length} modules: ${modules.join(", ")}\n`);

	// Generate READMEs
	for (const moduleName of modules) {
		const moduleInfo = generateModuleInfo(moduleName, facts);
		const readmePath = `docs/modules/${moduleName}/README.md`;

		// Ensure directory exists
		const dir = path.dirname(readmePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// Check if README exists
		if (fs.existsSync(readmePath)) {
			// Update AI-GENERATED section only
			const existingContent = fs.readFileSync(readmePath, "utf-8");
			const aiGenStart = existingContent.indexOf("<!-- BEGIN AI-GENERATED -->");
			const aiGenEnd =
				existingContent.indexOf("<!-- END AI-GENERATED -->") +
				"<!-- END AI-GENERATED -->".length;

			if (aiGenStart !== -1 && aiGenEnd !== -1) {
				const newContent = generateReadmeContent(moduleInfo);
				const newAiGenStart = newContent.indexOf("<!-- BEGIN AI-GENERATED -->");
				const newAiGenEnd =
					newContent.indexOf("<!-- END AI-GENERATED -->") +
					"<!-- END AI-GENERATED -->".length;

				const updated =
					existingContent.slice(0, aiGenStart) +
					newContent.slice(newAiGenStart, newAiGenEnd) +
					existingContent.slice(aiGenEnd);

				fs.writeFileSync(readmePath, updated);
				console.log(`✅ Updated: ${readmePath}`);
			} else {
				console.log(`⚠️  Skipping (no AI-GENERATED section): ${readmePath}`);
			}
		} else {
			// Create new README
			const content = generateReadmeContent(moduleInfo);
			fs.writeFileSync(readmePath, content);
			console.log(`✅ Created: ${readmePath}`);
		}
	}

	console.log(`\n✅ Generated/updated ${modules.length} module READMEs`);
}

main().catch(console.error);
