#!/usr/bin/env python3
"""
Validate Practice Hub database schema structure and conventions.

Ensures all tables follow multi-tenant patterns and best practices.

Usage:
    python scripts/validate_schema.py
    python scripts/validate_schema.py --strict
"""

import argparse
import os
import re
import sys
from typing import List, Dict, Set


class SchemaValidator:
    def __init__(self, schema_file: str = 'lib/db/schema.ts'):
        self.schema_file = schema_file
        self.tables = []
        self.issues = []
        self.warnings = []

    def validate(self) -> None:
        """Run all validation checks."""
        if not os.path.exists(self.schema_file):
            print(f"Error: Schema file '{self.schema_file}' not found", file=sys.stderr)
            sys.exit(1)

        with open(self.schema_file, 'r') as f:
            self.content = f.read()

        self.extract_tables()
        self.check_tenant_fields()
        self.check_timestamps()
        self.check_primary_keys()
        self.check_foreign_keys()

    def extract_tables(self) -> None:
        """Extract table definitions from schema."""
        # Pattern: export const tableName = pgTable("table_name", { ... })
        pattern = r'export const (\w+) = pgTable\("(\w+)",\s*\{([^}]+)\}'

        matches = re.finditer(pattern, self.content, re.DOTALL)

        for match in matches:
            const_name = match.group(1)
            table_name = match.group(2)
            fields_block = match.group(3)

            # Extract field names
            field_pattern = r'(\w+):\s*(?:text|varchar|uuid|integer|boolean|timestamp|decimal|jsonb|date)\('
            fields = re.findall(field_pattern, fields_block)

            self.tables.append({
                'const': const_name,
                'name': table_name,
                'fields': fields,
                'block': fields_block
            })

    def check_tenant_fields(self) -> None:
        """Check that all tables (except system tables) have tenantId."""
        # System tables that don't need tenantId
        system_tables = {
            'tenants',
            'session',  # Better Auth
            'account',  # Better Auth
            'verification',  # Better Auth
            'drizzle_migrations'  # Drizzle system table
        }

        for table in self.tables:
            if table['name'] in system_tables:
                continue

            if 'tenantId' not in table['fields']:
                self.issues.append({
                    'table': table['name'],
                    'type': 'missing_tenant_id',
                    'message': f"Table '{table['name']}' missing tenantId field",
                    'fix': "Add: tenantId: text('tenant_id').references(() => tenants.id).notNull()"
                })

    def check_timestamps(self) -> None:
        """Check that tables have createdAt and updatedAt."""
        for table in self.tables:
            # Skip system tables
            if table['name'] in ['session', 'account', 'verification']:
                continue

            if 'createdAt' not in table['fields']:
                self.warnings.append({
                    'table': table['name'],
                    'type': 'missing_created_at',
                    'message': f"Table '{table['name']}' missing createdAt timestamp",
                    'fix': "Add: createdAt: timestamp('created_at').defaultNow().notNull()"
                })

            if 'updatedAt' not in table['fields']:
                self.warnings.append({
                    'table': table['name'],
                    'type': 'missing_updated_at',
                    'message': f"Table '{table['name']}' missing updatedAt timestamp",
                    'fix': "Add: updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()"
                })

    def check_primary_keys(self) -> None:
        """Check that all tables have primary keys."""
        for table in self.tables:
            has_primary_key = 'primaryKey()' in table['block'] or '.id' in str(table['fields'])

            if not has_primary_key:
                self.issues.append({
                    'table': table['name'],
                    'type': 'missing_primary_key',
                    'message': f"Table '{table['name']}' may be missing primary key",
                    'fix': "Add: id: text('id').primaryKey() or uuid('id').defaultRandom().primaryKey()"
                })

    def check_foreign_keys(self) -> None:
        """Check foreign key references."""
        # Look for .references() calls
        fk_pattern = r'references\(\(\)\s*=>\s*(\w+)\.id\)'
        matches = re.finditer(fk_pattern, self.content)

        for match in matches:
            referenced_table = match.group(1)

            # Check if referenced table exists
            table_exists = any(t['const'] == referenced_table for t in self.tables)

            if not table_exists:
                self.warnings.append({
                    'type': 'invalid_foreign_key',
                    'message': f"Foreign key references non-existent table '{referenced_table}'",
                    'fix': f"Ensure table '{referenced_table}' is defined in schema"
                })

    def print_report(self) -> None:
        """Print validation report."""
        print(f"\n{'='*70}")
        print(f"Practice Hub Schema Validation")
        print(f"{'='*70}\n")

        print(f"📊 Analyzed {len(self.tables)} tables\n")

        if not self.issues and not self.warnings:
            print("✅ Schema validation passed!\n")
            return

        # Print critical issues
        if self.issues:
            print(f"🚨 CRITICAL ISSUES ({len(self.issues)}):")
            print(f"{'─'*70}\n")

            for issue in self.issues:
                print(f"Table: {issue.get('table', 'N/A')}")
                print(f"Issue: {issue['message']}")
                print(f"Fix:   {issue['fix']}")
                print()

        # Print warnings
        if self.warnings:
            print(f"⚠️  WARNINGS ({len(self.warnings)}):")
            print(f"{'─'*70}\n")

            for warning in self.warnings:
                print(f"Table: {warning.get('table', 'N/A')}")
                print(f"Issue: {warning['message']}")
                print(f"Fix:   {warning['fix']}")
                print()

        # Summary
        print(f"{'='*70}")
        print(f"Summary:")
        print(f"  Tables:   {len(self.tables)}")
        print(f"  🚨 Issues:   {len(self.issues)}")
        print(f"  ⚠️  Warnings: {len(self.warnings)}")
        print(f"{'='*70}\n")

        if self.issues:
            print("❌ FAILED: Fix critical issues before proceeding")
            sys.exit(1)
        elif self.warnings:
            print("⚠️  WARNINGS: Review before finalizing schema")
            sys.exit(0)


def main():
    parser = argparse.ArgumentParser(
        description='Validate Practice Hub database schema'
    )
    parser.add_argument(
        '--schema',
        default='lib/db/schema.ts',
        help='Path to schema file (default: lib/db/schema.ts)'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Treat warnings as errors'
    )

    args = parser.parse_args()

    # Run validation
    validator = SchemaValidator(args.schema)
    validator.validate()
    validator.print_report()

    # In strict mode, warnings are errors
    if args.strict and validator.warnings:
        sys.exit(1)


if __name__ == '__main__':
    main()
