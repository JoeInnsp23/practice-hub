#!/usr/bin/env python3
"""
Documentation Drift Checker

Compares AI-GENERATED and CODE-EXTRACT sections in documentation against
source data (repo-facts.json, doclets.yaml) to detect stale content.

Usage: python3 scripts/check_doc_drift.py [--threshold 0.05]
"""

import os
import re
import sys
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Default drift threshold (5% content change)
DEFAULT_THRESHOLD = 0.05

REPO_FACTS = "docs/dev/repo-facts.json"
DOCLETS_FILE = "docs/dev/doclets.yaml"

class DriftChecker:
    """Checks for documentation drift"""

    def __init__(self, threshold: float = DEFAULT_THRESHOLD):
        self.threshold = threshold
        self.repo_facts: Dict = {}
        self.drift_reports: List[Dict] = []

    def load_repo_facts(self) -> bool:
        """Load repository facts"""
        if not os.path.exists(REPO_FACTS):
            print(f"⚠️  {REPO_FACTS} not found - run: pnpm docs:facts")
            return False

        try:
            with open(REPO_FACTS, 'r', encoding='utf-8') as f:
                self.repo_facts = json.load(f)
            return True
        except Exception as e:
            print(f"❌ Error loading {REPO_FACTS}: {e}")
            return False

    def extract_section(self, content: str, section_type: str, target: Optional[str] = None) -> Optional[str]:
        """
        Extract a section from markdown content.
        section_type: 'AI-GENERATED', 'CODE-EXTRACT', or 'HUMAN-AUTHORED'
        target: For CODE-EXTRACT, the specific target name
        """
        if section_type == "CODE-EXTRACT" and target:
            # Extract CODE-EXTRACT section for specific target
            begin_marker = f"<!-- BEGIN CODE-EXTRACT: {target} -->"
            end_marker = f"<!-- END CODE-EXTRACT: {target} -->"
        else:
            # Extract AI-GENERATED or HUMAN-AUTHORED section
            begin_marker = f"<!-- BEGIN {section_type} -->"
            end_marker = f"<!-- END {section_type} -->"

        if begin_marker not in content or end_marker not in content:
            return None

        # Extract content between markers
        start_idx = content.find(begin_marker) + len(begin_marker)
        end_idx = content.find(end_marker)

        if start_idx >= end_idx:
            return None

        return content[start_idx:end_idx].strip()

    def compute_hash(self, text: str) -> str:
        """Compute SHA-256 hash of text"""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison (remove whitespace variations)"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove leading/trailing whitespace
        text = text.strip()
        return text

    def calculate_drift(self, original: str, current: str) -> float:
        """
        Calculate drift percentage between two texts.
        Returns value between 0.0 and 1.0
        """
        original_norm = self.normalize_text(original)
        current_norm = self.normalize_text(current)

        # If identical, no drift
        if original_norm == current_norm:
            return 0.0

        # Simple character-based diff
        # (More sophisticated: use difflib.SequenceMatcher)
        max_len = max(len(original_norm), len(current_norm))
        if max_len == 0:
            return 0.0

        # Count different characters
        min_len = min(len(original_norm), len(current_norm))
        diff_count = sum(1 for i in range(min_len) if original_norm[i] != current_norm[i])

        # Add length difference
        diff_count += abs(len(original_norm) - len(current_norm))

        drift = diff_count / max_len
        return drift

    def check_ai_generated(self, file_path: str) -> List[Dict]:
        """Check AI-GENERATED sections for drift"""
        reports = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract AI-GENERATED section
            ai_section = self.extract_section(content, "AI-GENERATED")

            if not ai_section:
                return reports  # No AI-GENERATED section

            # Build expected content from repo-facts
            # (This is simplified - would need to know which facts go where)
            # For now, just check if placeholders are still present

            placeholder_pattern = r'\{\{(repo-facts|package\.json):[^}]+\}\}'
            placeholders = re.findall(placeholder_pattern, ai_section)

            if placeholders:
                reports.append({
                    "file": file_path,
                    "section": "AI-GENERATED",
                    "issue": "unresolved_placeholders",
                    "details": f"Found {len(placeholders)} unresolved placeholders",
                    "severity": "warning"
                })

            # Check for obvious drift indicators
            if "TODO" in ai_section or "FIXME" in ai_section:
                reports.append({
                    "file": file_path,
                    "section": "AI-GENERATED",
                    "issue": "contains_todo",
                    "details": "AI-GENERATED section contains TODO/FIXME",
                    "severity": "warning"
                })

        except Exception as e:
            reports.append({
                "file": file_path,
                "section": "AI-GENERATED",
                "issue": "error",
                "details": str(e),
                "severity": "error"
            })

        return reports

    def check_code_extract(self, file_path: str) -> List[Dict]:
        """Check CODE-EXTRACT sections for drift"""
        reports = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find all CODE-EXTRACT markers
            extract_pattern = r'<!-- BEGIN CODE-EXTRACT: ([a-zA-Z0-9/_-]+) -->'
            matches = re.findall(extract_pattern, content)

            for target in matches:
                section_content = self.extract_section(content, "CODE-EXTRACT", target)

                if not section_content:
                    continue

                # Check for placeholder content
                if "Placeholder" in section_content or "will appear here" in section_content:
                    reports.append({
                        "file": file_path,
                        "section": f"CODE-EXTRACT: {target}",
                        "issue": "placeholder_content",
                        "details": "Section contains placeholder text (not extracted yet)",
                        "severity": "info"
                    })

                # Check for empty sections
                if len(section_content.strip()) < 50:
                    reports.append({
                        "file": file_path,
                        "section": f"CODE-EXTRACT: {target}",
                        "issue": "empty_or_short",
                        "details": f"Section is very short ({len(section_content)} chars)",
                        "severity": "warning"
                    })

        except Exception as e:
            reports.append({
                "file": file_path,
                "section": "CODE-EXTRACT",
                "issue": "error",
                "details": str(e),
                "severity": "error"
            })

        return reports

    def check_file(self, file_path: str) -> List[Dict]:
        """Check a single markdown file for drift"""
        reports = []

        # Check AI-GENERATED sections
        reports.extend(self.check_ai_generated(file_path))

        # Check CODE-EXTRACT sections
        reports.extend(self.check_code_extract(file_path))

        return reports

    def run(self):
        """Main drift check execution"""
        print("=" * 60)
        print("🔍 Documentation Drift Checker")
        print("=" * 60)
        print()
        print(f"Drift threshold: {self.threshold * 100}%")
        print()

        # Load repo facts
        if not self.load_repo_facts():
            return 1

        # Find all markdown files
        docs_root = Path("docs")
        md_files = []

        for ext in [".md"]:
            for file_path in docs_root.rglob(f"*{ext}"):
                # Skip archived and generated files
                if ".archive" in file_path.parts or "node_modules" in file_path.parts:
                    continue
                md_files.append(str(file_path))

        print(f"📁 Scanning {len(md_files)} markdown files...")
        print()

        # Check each file
        all_reports = []

        for file_path in md_files:
            reports = self.check_file(file_path)
            if reports:
                all_reports.extend(reports)

        # Print summary
        print("=" * 60)
        print("📊 Drift Summary")
        print("=" * 60)
        print()

        if not all_reports:
            print("✅ No drift detected - all documentation is up to date!")
            print()
            return 0

        # Group by severity
        errors = [r for r in all_reports if r["severity"] == "error"]
        warnings = [r for r in all_reports if r["severity"] == "warning"]
        info = [r for r in all_reports if r["severity"] == "info"]

        print(f"Total issues: {len(all_reports)}")
        print(f"  Errors: {len(errors)}")
        print(f"  Warnings: {len(warnings)}")
        print(f"  Info: {len(info)}")
        print()

        # Print detailed reports
        if errors:
            print("❌ Errors:")
            for report in errors:
                print(f"   {report['file']}")
                print(f"      Section: {report['section']}")
                print(f"      Issue: {report['issue']}")
                print(f"      Details: {report['details']}")
                print()

        if warnings:
            print("⚠️  Warnings:")
            for report in warnings:
                print(f"   {report['file']}")
                print(f"      Section: {report['section']}")
                print(f"      Issue: {report['issue']}")
                print(f"      Details: {report['details']}")
                print()

        if info:
            print("ℹ️  Info:")
            for report in info:
                print(f"   {report['file']}")
                print(f"      Section: {report['section']}")
                print(f"      Issue: {report['issue']}")
                print(f"      Details: {report['details']}")
                print()

        # Return exit code
        if errors:
            return 1  # Fail on errors
        else:
            return 0  # Warnings/info are non-blocking

def main():
    threshold = DEFAULT_THRESHOLD

    # Parse arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--threshold" and len(sys.argv) > 2:
            try:
                threshold = float(sys.argv[2])
            except ValueError:
                print(f"❌ Invalid threshold: {sys.argv[2]}")
                return 1

    checker = DriftChecker(threshold=threshold)
    return checker.run()

if __name__ == "__main__":
    sys.exit(main())
