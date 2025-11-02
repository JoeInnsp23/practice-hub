#!/usr/bin/env tsx
/**
 * Documentation Maintenance Runner
 * Orchestrates full documentation maintenance cycle
 */

import { execSync } from "node:child_process";
import fs from "node:fs";

interface MaintenanceOptions {
	skipTests?: boolean;
	commit?: boolean;
	verbose?: boolean;
}

interface MaintenanceResult {
	success: boolean;
	steps: Array<{
		name: string;
		success: boolean;
		duration: number;
		output?: string;
		error?: string;
	}>;
	totalDuration: number;
}

class DocumentationMaintainer {
	private options: MaintenanceOptions;
	private result: MaintenanceResult;

	constructor(options: MaintenanceOptions = {}) {
		this.options = {
			skipTests: options.skipTests ?? false,
			commit: options.commit ?? false,
			verbose: options.verbose ?? false,
		};

		this.result = {
			success: true,
			steps: [],
			totalDuration: 0,
		};
	}

	/**
	 * Run a command and track result
	 */
	private runStep(name: string, command: string): boolean {
		const startTime = Date.now();
		let success = true;
		let output = "";
		let error = "";

		try {
			if (this.options.verbose) {
				console.log(`\n🔧 Running: ${name}`);
				console.log(`   Command: ${command}\n`);
			}

			output = execSync(command, {
				encoding: "utf-8",
				stdio: this.options.verbose ? "inherit" : "pipe",
			});

			if (this.options.verbose) {
				console.log(`✅ ${name} completed\n`);
			}
		} catch (e: any) {
			success = false;
			error = e.message || String(e);

			console.error(`\n❌ ${name} failed:`);
			console.error(`   ${error}\n`);

			this.result.success = false;
		}

		const duration = Date.now() - startTime;

		this.result.steps.push({
			name,
			success,
			duration,
			output: this.options.verbose ? output : undefined,
			error: error || undefined,
		});

		return success;
	}

	/**
	 * Derive repository facts
	 */
	private async deriveRepoFacts(): Promise<boolean> {
		return this.runStep(
			"Derive Repo Facts",
			"tsx scripts/derive_repo_facts.ts",
		);
	}

	/**
	 * Extract documentation tags
	 */
	private async extractDoclets(): Promise<boolean> {
		return this.runStep(
			"Extract Documentation Tags",
			"python3 scripts/extract_doclets.py",
		);
	}

	/**
	 * Build unified documentation
	 */
	private async buildDocs(): Promise<boolean> {
		return this.runStep(
			"Build Unified Documentation",
			"python3 scripts/build_docs.py",
		);
	}

	/**
	 * Generate documentation index
	 */
	private async generateDocIndex(): Promise<boolean> {
		return this.runStep(
			"Generate Doc Index",
			"tsx .claude/skills/practice-hub-docs-search/scripts/generate-doc-index.ts",
		);
	}

	/**
	 * Generate code index
	 */
	private async generateCodeIndex(): Promise<boolean> {
		return this.runStep(
			"Generate Code Index",
			"tsx .claude/skills/practice-hub-docs-search/scripts/generate-code-index.ts",
		);
	}

	/**
	 * Validate frontmatter
	 */
	private async validateFrontmatter(): Promise<boolean> {
		return this.runStep(
			"Validate Frontmatter",
			"tsx scripts/validate-frontmatter.ts",
		);
	}

	/**
	 * Check for orphaned docs
	 */
	private async checkOrphans(): Promise<boolean> {
		return this.runStep(
			"Check for Orphaned Docs",
			"bash scripts/find-orphaned-docs.sh",
		);
	}

	/**
	 * Check for documentation drift
	 */
	private async checkDrift(): Promise<boolean> {
		return this.runStep(
			"Check Documentation Drift",
			"python3 scripts/check_doc_drift.py",
		);
	}

	/**
	 * Run redundancy audit
	 */
	private async runRedundancyAudit(): Promise<boolean> {
		return this.runStep(
			"Run Redundancy Audit",
			"tsx scripts/audit-redundancy.ts",
		);
	}

	/**
	 * Commit changes if requested
	 */
	private async commitChanges(): Promise<boolean> {
		if (!this.options.commit) {
			console.log("\nℹ️  Skipping commit (--commit not specified)\n");
			return true;
		}

		// Check if there are changes
		try {
			const status = execSync("git status --porcelain docs/", {
				encoding: "utf-8",
			});

			if (!status.trim()) {
				console.log("\n✅ No documentation changes to commit\n");
				return true;
			}

			// Commit changes
			return this.runStep(
				"Commit Documentation Changes",
				'git add docs/ && git commit -m "docs: automated maintenance update\n\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude <noreply@anthropic.com>"',
			);
		} catch (e: any) {
			console.error(`\n❌ Failed to commit: ${e.message}\n`);
			return false;
		}
	}

	/**
	 * Run full maintenance cycle
	 */
	async run(): Promise<MaintenanceResult> {
		const startTime = Date.now();

		console.log("=" + "=".repeat(60));
		console.log("📚 Documentation Maintenance");
		console.log("=" + "=".repeat(60));
		console.log();

		// Step 1: Derive repo facts
		if (!(await this.deriveRepoFacts())) {
			this.result.totalDuration = Date.now() - startTime;
			return this.result;
		}

		// Step 2: Extract documentation tags
		if (!(await this.extractDoclets())) {
			this.result.totalDuration = Date.now() - startTime;
			return this.result;
		}

		// Step 3: Build unified docs
		if (!(await this.buildDocs())) {
			this.result.totalDuration = Date.now() - startTime;
			return this.result;
		}

		// Step 4: Generate indices
		await this.generateDocIndex();
		await this.generateCodeIndex();

		// Step 5: Validation (unless skipped)
		if (!this.options.skipTests) {
			await this.validateFrontmatter();
			await this.checkOrphans();
			await this.checkDrift();
		}

		// Step 6: Redundancy audit
		await this.runRedundancyAudit();

		// Step 7: Commit if requested
		await this.commitChanges();

		this.result.totalDuration = Date.now() - startTime;

		// Print summary
		this.printSummary();

		return this.result;
	}

	/**
	 * Print execution summary
	 */
	private printSummary(): void {
		console.log("\n" + "=" + "=".repeat(60));
		console.log("📊 Maintenance Summary");
		console.log("=" + "=".repeat(60));
		console.log();

		const successCount = this.result.steps.filter((s) => s.success).length;
		const failCount = this.result.steps.filter((s) => !s.success).length;

		console.log(`Total Steps: ${this.result.steps.length}`);
		console.log(`Successful: ${successCount}`);
		console.log(`Failed: ${failCount}`);
		console.log(
			`Total Duration: ${(this.result.totalDuration / 1000).toFixed(2)}s`,
		);
		console.log();

		// List failed steps
		if (failCount > 0) {
			console.log("❌ Failed Steps:");
			for (const step of this.result.steps.filter((s) => !s.success)) {
				console.log(`   - ${step.name}`);
			}
			console.log();
		}

		// Overall status
		if (this.result.success) {
			console.log("✅ Documentation maintenance completed successfully!");
		} else {
			console.log("❌ Documentation maintenance completed with errors");
			console.log("   Review output above for details");
		}

		console.log();
	}
}

/**
 * CLI entry point
 */
async function main() {
	const args = process.argv.slice(2);

	const options: MaintenanceOptions = {
		skipTests: args.includes("--skip-tests"),
		commit: args.includes("--commit"),
		verbose: args.includes("--verbose") || args.includes("-v"),
	};

	const maintainer = new DocumentationMaintainer(options);
	const result = await maintainer.run();

	process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
	main().catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
}

export { DocumentationMaintainer };
export type { MaintenanceOptions, MaintenanceResult };
