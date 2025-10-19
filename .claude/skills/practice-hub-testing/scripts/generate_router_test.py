#!/usr/bin/env python3
"""
Generate Vitest test boilerplate for tRPC routers in Practice Hub.

Usage:
    python scripts/generate_router_test.py app/server/routers/clients.ts
    python scripts/generate_router_test.py app/server/routers/proposals.ts --output app/server/routers/proposals.test.ts
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Dict


def extract_procedures(router_file: str) -> Dict[str, List[str]]:
    """Extract procedure names and types from tRPC router file."""
    with open(router_file, 'r') as f:
        content = f.read()

    procedures = {
        'query': [],
        'mutation': [],
        'protected': [],
        'admin': [],
        'clientPortal': []
    }

    # Match patterns like: procedureName: protectedProcedure.query(...)
    query_pattern = r'(\w+):\s*(\w+Procedure)\.(query|mutation)\('
    matches = re.findall(query_pattern, content)

    for proc_name, proc_type, operation in matches:
        procedures[operation].append(proc_name)

        if 'protected' in proc_type.lower():
            procedures['protected'].append(proc_name)
        elif 'admin' in proc_type.lower():
            procedures['admin'].append(proc_name)
        elif 'clientportal' in proc_type.lower():
            procedures['clientPortal'].append(proc_name)

    return procedures


def generate_test_template(router_name: str, procedures: Dict[str, List[str]]) -> str:
    """Generate comprehensive test template."""

    template = f'''import {{ describe, it, expect, beforeEach, afterEach, vi }} from 'vitest';
import {{ appRouter }} from '../index';
import {{ db }} from '@/lib/db';
import {{ {router_name}, tenants, users }} from '@/lib/db/schema';
import {{ eq }} from 'drizzle-orm';

describe('{router_name} router', () => {{
  const TEST_TENANT_ID = 'test-tenant-{router_name}';
  const TEST_USER_ID = 'test-user-{router_name}';

  // Mock auth context
  const mockAuthContext = {{
    userId: TEST_USER_ID,
    tenantId: TEST_TENANT_ID,
    role: 'admin',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  }};

  const mockContext = {{
    session: {{ user: {{ id: TEST_USER_ID }} }},
    authContext: mockAuthContext,
    clientPortalSession: null,
    clientPortalAuthContext: null,
  }};

  beforeEach(async () => {{
    // Create test tenant
    await db.insert(tenants).values({{
      id: TEST_TENANT_ID,
      name: 'Test Organization',
      slug: 'test-org-{router_name}',
    }});

    // Create test user
    await db.insert(users).values({{
      id: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
      email: 'test@example.com',
      role: 'admin',
      firstName: 'Test',
      lastName: 'User',
    }});

    // TODO: Add test data for {router_name} table
  }});

  afterEach(async () => {{
    // Clean up test data
    await db.delete({router_name}).where(eq({router_name}.tenantId, TEST_TENANT_ID));
    await db.delete(users).where(eq(users.tenantId, TEST_TENANT_ID));
    await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));
  }});

  describe('Query procedures', () => {{
'''

    # Add query tests
    for query in procedures.get('query', []):
        template += f'''
    it('should execute {query} query', async () => {{
      const caller = appRouter.createCaller(mockContext);

      // TODO: Add test data

      const result = await caller.{router_name}.{query}();

      // TODO: Add assertions
      expect(result).toBeDefined();
    }});
'''

    template += '''  });

  describe('Mutation procedures', () => {
'''

    # Add mutation tests
    for mutation in procedures.get('mutation', []):
        template += f'''
    it('should execute {mutation} mutation', async () => {{
      const caller = appRouter.createCaller(mockContext);

      // TODO: Add input data
      const input = {{}};

      const result = await caller.{router_name}.{mutation}(input);

      // TODO: Add assertions
      expect(result).toBeDefined();
    }});
'''

    template += '''  });

  describe('Multi-tenant isolation', () => {
    it('should only return data for authenticated tenant', async () => {
      const caller = appRouter.createCaller(mockContext);

      // TODO: Create data for multiple tenants

      const result = await caller.''' + router_name + '''.list();

      // Verify all results belong to TEST_TENANT_ID
      if (Array.isArray(result)) {
        expect(result.every(item => item.tenantId === TEST_TENANT_ID)).toBe(true);
      }
    });

    it('should prevent access to other tenant data', async () => {
      const caller = appRouter.createCaller(mockContext);

      // TODO: Try to access data from different tenant
      // Expect this to fail or return empty
    });
  });
'''

    # Add admin procedure tests
    if procedures.get('admin'):
        template += '''
  describe('Admin-only procedures', () => {
    it('should require admin role', async () => {
      const nonAdminContext = {
        ...mockContext,
        authContext: { ...mockAuthContext, role: 'member' },
      };

      const caller = appRouter.createCaller(nonAdminContext);

      // TODO: Test admin procedure - should throw
      // await expect(caller.''' + router_name + '''.adminProcedure()).rejects.toThrow();
    });
  });
'''

    template += '''});
'''

    return template


def main():
    parser = argparse.ArgumentParser(
        description='Generate Vitest test boilerplate for tRPC routers'
    )
    parser.add_argument(
        'router_file',
        help='Path to tRPC router file (e.g., app/server/routers/clients.ts)'
    )
    parser.add_argument(
        '--output',
        help='Output test file path (default: <router_file>.test.ts)',
        default=None
    )

    args = parser.parse_args()

    # Validate input file
    if not os.path.exists(args.router_file):
        print(f"Error: Router file '{args.router_file}' not found", file=sys.stderr)
        sys.exit(1)

    # Determine output file
    if args.output:
        output_file = args.output
    else:
        base = args.router_file.replace('.ts', '')
        output_file = f"{base}.test.ts"

    # Extract router name from file
    router_name = Path(args.router_file).stem

    # Parse router file
    print(f"Analyzing router: {router_name}")
    procedures = extract_procedures(args.router_file)

    print(f"Found procedures:")
    print(f"  Queries: {len(procedures['query'])}")
    print(f"  Mutations: {len(procedures['mutation'])}")
    print(f"  Protected: {len(procedures['protected'])}")
    print(f"  Admin: {len(procedures['admin'])}")

    # Generate test template
    test_content = generate_test_template(router_name, procedures)

    # Write output
    with open(output_file, 'w') as f:
        f.write(test_content)

    print(f"\n✅ Test template generated: {output_file}")
    print(f"\nNext steps:")
    print(f"1. Review generated test file")
    print(f"2. Add test data in beforeEach hook")
    print(f"3. Complete TODO assertions")
    print(f"4. Run tests: pnpm test {output_file}")


if __name__ == '__main__':
    main()
