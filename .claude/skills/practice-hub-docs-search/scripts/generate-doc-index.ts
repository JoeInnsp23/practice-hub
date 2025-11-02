#!/usr/bin/env tsx
/**
 * AI Documentation Index Generator
 * Scans docs/ for markdown files and generates searchable index
 * Uses frontmatter for metadata, deduplicates, validates links
 */

import { globSync } from "glob";
import fs from "node:fs";
import path from "node:path";

interface DocEntry {
	path: string;
	title: string;
	description: string;
	audience: string[];
	status: "complete" | "draft" | "stub" | "deprecated";
	generated: "CODE-EXTRACT" | "AI-GENERATED" | "HUMAN-AUTHORED" | "HYBRID";
	lastModified: string;
	wordCount: number;
	sections: string[];
	tags: string[];
}

interface DocIndex {
	generated: string;
	totalDocs: number;
	byStatus: Record<string, number>;
	byGenerated: Record<string, number>;
	entries: DocEntry[];
}

/**
 * Extract YAML frontmatter from markdown
 */
function extractFrontmatter(content: string): Record<string, any> | null {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	try {
		// Simple YAML parser (enough for our frontmatter)
		const lines = match[1].split("\n");
		const result: Record<string, any> = {};

		for (const line of lines) {
			const colonIndex = line.indexOf(":");
			if (colonIndex === -1) continue;

			const key = line.substring(0, colonIndex).trim();
			let value = line.substring(colonIndex + 1).trim();

			// Handle arrays
			if (value.startsWith("[") && value.endsWith("]")) {
				value = value
					.slice(1, -1)
					.split(",")
					.map((v) => v.trim().replace(/['"]/g, ""));
			} else {
				// Remove quotes
				value = value.replace(/^["']|["']$/g, "");
			}

			result[key] = value;
		}

		return result;
	} catch (error) {
		console.error("Failed to parse frontmatter:", error);
		return null;
	}
}

/**
 * Extract markdown headings as sections
 */
function extractSections(content: string): string[] {
	const headings = content.match(/^#{1,3}\s+(.+)$/gm) || [];
	return headings
		.map((h) => h.replace(/^#+\s+/, "").trim())
		.filter((h) => !h.startsWith("<!--"));
}

/**
 * Count words in markdown (excluding code blocks)
 */
function countWords(content: string): number {
	// Remove code blocks
	let text = content.replace(/```[\s\S]*?```/g, "");
	// Remove inline code
	text = text.replace(/`[^`]+`/g, "");
	// Remove frontmatter
	text = text.replace(/^---[\s\S]*?---/, "");
	// Count words
	const words = text.match(/\b\w+\b/g) || [];
	return words.length;
}

/**
 * Scan a markdown file and extract metadata
 */
function scanDocument(filePath: string): DocEntry | null {
	const content = fs.readFileSync(filePath, "utf-8");
	const frontmatter = extractFrontmatter(content);

	if (!frontmatter) {
		console.warn(`⚠️  No frontmatter: ${filePath}`);
		return null;
	}

	const stats = fs.statSync(filePath);
	const relativePath = filePath.replace(/^docs\//, "");

	return {
		path: relativePath,
		title: frontmatter.title || path.basename(filePath, ".md"),
		description: frontmatter.description || "",
		audience: Array.isArray(frontmatter.audience)
			? frontmatter.audience
			: frontmatter.audience
				? [frontmatter.audience]
				: ["dev"],
		status: frontmatter.status || "draft",
		generated: frontmatter.generated || "HUMAN-AUTHORED",
		lastModified: stats.mtime.toISOString(),
		wordCount: countWords(content),
		sections: extractSections(content),
		tags: frontmatter.tags || [],
	};
}

/**
 * Validate documentation index for issues
 */
function validateIndex(index: DocIndex): string[] {
	const issues: string[] = [];

	// Check for duplicate titles
	const titleCounts = new Map<string, number>();
	for (const entry of index.entries) {
		titleCounts.set(entry.title, (titleCounts.get(entry.title) || 0) + 1);
	}
	for (const [title, count] of titleCounts) {
		if (count > 1) {
			issues.push(`Duplicate title: "${title}" (${count} files)`);
		}
	}

	// Check for missing descriptions
	const missingDesc = index.entries.filter((e) => !e.description);
	if (missingDesc.length > 0) {
		issues.push(
			`Missing descriptions: ${missingDesc.map((e) => e.path).join(", ")}`,
		);
	}

	// Check for stub docs that are too old
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const staleStubs = index.entries.filter(
		(e) => e.status === "stub" && new Date(e.lastModified) < sixMonthsAgo,
	);

	if (staleStubs.length > 0) {
		issues.push(
			`Stale stubs (>6 months): ${staleStubs.map((e) => e.path).join(", ")}`,
		);
	}

	return issues;
}

/**
 * Main execution
 */
async function main() {
	console.log("📚 Generating documentation index...\n");

	// Find all markdown files
	const files = globSync("docs/**/*.md", {
		ignore: [
			"**/node_modules/**",
			"**/.archive/**",
			"**/reference/typescript/**", // Ignore TypeDoc (will be deleted)
		],
	});

	console.log(`Found ${files.length} markdown files\n`);

	// Scan each file
	const entries: DocEntry[] = [];
	for (const file of files) {
		const entry = scanDocument(file);
		if (entry) {
			entries.push(entry);
		}
	}

	// Build index
	const byStatus: Record<string, number> = {};
	const byGenerated: Record<string, number> = {};

	for (const entry of entries) {
		byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
		byGenerated[entry.generated] = (byGenerated[entry.generated] || 0) + 1;
	}

	const index: DocIndex = {
		generated: new Date().toISOString(),
		totalDocs: entries.length,
		byStatus,
		byGenerated,
		entries: entries.sort((a, b) => a.path.localeCompare(b.path)),
	};

	// Validate
	const issues = validateIndex(index);
	if (issues.length > 0) {
		console.log("⚠️  Validation issues:");
		for (const issue of issues) {
			console.log(`   - ${issue}`);
		}
		console.log();
	}

	// Write JSON
	const outPath = ".claude/skills/practice-hub-docs-search/doc-index.json";
	fs.writeFileSync(outPath, JSON.stringify(index, null, 2));

	console.log("✅ Documentation index generated:");
	console.log(`   Total Docs: ${index.totalDocs}`);
	console.log(`   By Status:`, byStatus);
	console.log(`   By Generated:`, byGenerated);
	console.log(`\n📄 Output: ${outPath}`);
}

main().catch(console.error);
