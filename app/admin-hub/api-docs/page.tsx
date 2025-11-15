import { getAllExternalApis } from "@/lib/api-docs/external-apis";
import { generateApiDocs } from "@/lib/api-docs/generate-docs";
import { generateSchemaDocs } from "@/lib/api-docs/schema-docs";
import { ApiDocsClient } from "./api-docs-client";

/**
 * API Documentation Page (Server Component)
 *
 * Admin-only page displaying comprehensive API documentation:
 * - Internal tRPC API endpoints
 * - External API integrations (Companies House, HMRC, DocuSeal)
 * - Database schema reference
 *
 * Access: Admin users only (enforced by middleware + layout)
 */
export default async function ApiDocsPage() {
  // Generate documentation server-side
  const [internalDocs, externalApis, schemaDocs] = await Promise.all([
    generateApiDocs(),
    Promise.resolve(getAllExternalApis()),
    generateSchemaDocs(),
  ]);

  return (
    <div className="container mx-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Documentation
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive documentation for Practice Hub APIs, integrations, and
            database schema
          </p>
        </div>

        <ApiDocsClient
          internalDocs={internalDocs}
          externalApis={externalApis}
          schemaDocs={schemaDocs}
        />
      </div>
    </div>
  );
}
