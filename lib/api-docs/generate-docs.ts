/**
 * tRPC API Documentation Generator
 *
 * Extracts metadata from tRPC routers to generate comprehensive API documentation.
 * Supports type-safe documentation with input/output schemas, descriptions, and examples.
 *
 * Usage:
 *   import { generateApiDocs } from "@/lib/api-docs/generate-docs";
 *   const docs = await generateApiDocs();
 */

import { appRouter } from "@/app/server";

export interface ApiDocProcedure {
  name: string;
  type: "query" | "mutation" | "subscription";
  description?: string;
  input?: {
    schema: string;
    example?: unknown;
  };
  output?: {
    schema: string;
    example?: unknown;
  };
  requiresAuth: boolean;
  requiresAdmin: boolean;
}

export interface ApiDocRouter {
  name: string;
  description?: string;
  procedures: ApiDocProcedure[];
}

export interface ApiDocumentation {
  routers: ApiDocRouter[];
  generatedAt: string;
  version: string;
}

/**
 * Extract procedure metadata from tRPC router
 */
function extractProcedureMetadata(
  procedureName: string,
  // biome-ignore lint/suspicious/noExplicitAny: tRPC internal types are complex
  procedure: any,
): ApiDocProcedure {
  const type =
    procedure._def.query !== undefined
      ? "query"
      : procedure._def.mutation !== undefined
        ? "mutation"
        : "subscription";

  // Extract input schema information
  let inputSchema: string | undefined;
  let inputExample: unknown;

  // biome-ignore lint/suspicious/noExplicitAny: tRPC internal types are complex
  const def: any = procedure._def;
  if (def.inputs && def.inputs.length > 0) {
    const input = def.inputs[0];
    if (input && typeof input === "object" && "_def" in input) {
      inputSchema = extractZodSchema(input);
      inputExample = generateExample(input);
    }
  }

  // Detect auth requirements from procedure type
  const requiresAuth = def.meta?.requiresAuth ?? false;
  const requiresAdmin = def.meta?.requiresAdmin ?? false;

  return {
    name: procedureName,
    type,
    description: def.meta?.description,
    input: inputSchema
      ? {
          schema: inputSchema,
          example: inputExample,
        }
      : undefined,
    requiresAuth,
    requiresAdmin,
  };
}

/**
 * Extract Zod schema as readable string
 */
// biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
function extractZodSchema(zodSchema: any): string {
  try {
    if (!zodSchema || !zodSchema._def) return "unknown";

    const typeName = zodSchema._def.typeName;

    switch (typeName) {
      case "ZodObject": {
        const shape = zodSchema._def.shape();
        const fields = Object.entries(shape)
          .map(([key, value]) => {
            // biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
            const fieldSchema = extractZodSchema(value as any);
            return `  ${key}: ${fieldSchema}`;
          })
          .join(",\n");
        return `{\n${fields}\n}`;
      }

      case "ZodString":
        return "string";

      case "ZodNumber":
        return "number";

      case "ZodBoolean":
        return "boolean";

      case "ZodDate":
        return "Date";

      case "ZodArray":
        return `Array<${extractZodSchema(zodSchema._def.type)}>`;

      case "ZodOptional":
        return `${extractZodSchema(zodSchema._def.innerType)}?`;

      case "ZodNullable":
        return `${extractZodSchema(zodSchema._def.innerType)} | null`;

      case "ZodEnum":
        return `"${zodSchema._def.values.join('" | "')}"`;

      case "ZodUnion":
        return (
          zodSchema._def.options
            // biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
            .map((opt: any) => extractZodSchema(opt))
            .join(" | ")
        );

      case "ZodLiteral":
        return JSON.stringify(zodSchema._def.value);

      default:
        return typeName?.replace("Zod", "").toLowerCase() || "unknown";
    }
  } catch {
    return "unknown";
  }
}

/**
 * Generate example data from Zod schema
 */
// biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
function generateExample(zodSchema: any): unknown {
  try {
    if (!zodSchema || !zodSchema._def) return undefined;

    const typeName = zodSchema._def.typeName;

    switch (typeName) {
      case "ZodObject": {
        const shape = zodSchema._def.shape();
        const example: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(shape)) {
          // biome-ignore lint/suspicious/noExplicitAny: Zod schema types are complex
          example[key] = generateExample(value as any);
        }
        return example;
      }

      case "ZodString":
        return "example_string";

      case "ZodNumber":
        return 42;

      case "ZodBoolean":
        return true;

      case "ZodDate":
        return new Date().toISOString();

      case "ZodArray":
        return [generateExample(zodSchema._def.type)];

      case "ZodOptional":
        return generateExample(zodSchema._def.innerType);

      case "ZodNullable":
        return generateExample(zodSchema._def.innerType);

      case "ZodEnum":
        return zodSchema._def.values[0];

      case "ZodUnion":
        return generateExample(zodSchema._def.options[0]);

      case "ZodLiteral":
        return zodSchema._def.value;

      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * Extract all procedures from a router
 */
function extractRouterProcedures(
  routerName: string,
  // biome-ignore lint/suspicious/noExplicitAny: tRPC internal types are complex
  router: any,
): ApiDocRouter {
  const procedures: ApiDocProcedure[] = [];

  // Extract procedures from router._def.procedures
  if (router._def?.procedures) {
    for (const [procName, procedure] of Object.entries(
      router._def.procedures,
    )) {
      try {
        procedures.push(extractProcedureMetadata(procName, procedure));
      } catch (error) {
        console.error(
          `Failed to extract metadata for ${routerName}.${procName}:`,
          error,
        );
      }
    }
  }

  return {
    name: routerName,
    description: router._def?.meta?.description,
    procedures,
  };
}

/**
 * Generate complete API documentation from tRPC app router
 */
export async function generateApiDocs(): Promise<ApiDocumentation> {
  const routers: ApiDocRouter[] = [];

  // Extract all routers from appRouter
  if (appRouter._def?.procedures) {
    for (const [routerName, router] of Object.entries(
      appRouter._def.procedures,
    )) {
      try {
        routers.push(extractRouterProcedures(routerName, router));
      } catch (error) {
        console.error(`Failed to extract router ${routerName}:`, error);
      }
    }
  }

  return {
    routers,
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
  };
}

/**
 * Generate markdown documentation
 */
export async function generateMarkdownDocs(): Promise<string> {
  const docs = await generateApiDocs();
  let markdown = `# Practice Hub API Documentation\n\n`;
  markdown += `Generated: ${new Date(docs.generatedAt).toLocaleString()}\n\n`;
  markdown += `Version: ${docs.version}\n\n`;
  markdown += `---\n\n`;

  for (const router of docs.routers) {
    markdown += `## ${router.name}\n\n`;
    if (router.description) {
      markdown += `${router.description}\n\n`;
    }

    for (const proc of router.procedures) {
      markdown += `### ${proc.name} (${proc.type})\n\n`;

      if (proc.description) {
        markdown += `${proc.description}\n\n`;
      }

      // Auth requirements
      const authBadges: string[] = [];
      if (proc.requiresAuth) authBadges.push("🔒 Requires Authentication");
      if (proc.requiresAdmin) authBadges.push("👑 Admin Only");
      if (authBadges.length > 0) {
        markdown += `${authBadges.join(" | ")}\n\n`;
      }

      // Input schema
      if (proc.input) {
        markdown += `**Input:**\n\`\`\`typescript\n${proc.input.schema}\n\`\`\`\n\n`;
        if (proc.input.example) {
          markdown += `**Example:**\n\`\`\`json\n${JSON.stringify(proc.input.example, null, 2)}\n\`\`\`\n\n`;
        }
      }

      markdown += `---\n\n`;
    }
  }

  return markdown;
}
