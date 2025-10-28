/**
 * Database Schema Documentation Generator
 *
 * Extracts database schema information from Drizzle ORM definitions
 * to generate comprehensive database documentation.
 */

import * as schema from "@/lib/db/schema";

export interface SchemaTableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: string;
}

export interface SchemaTable {
  name: string;
  description?: string;
  columns: SchemaTableColumn[];
  indexes?: string[];
  relationships?: {
    type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
    table: string;
    description?: string;
  }[];
}

export interface SchemaDocs {
  tables: SchemaTable[];
  generatedAt: string;
  totalTables: number;
  totalColumns: number;
}

/**
 * Extract column information from Drizzle column definition
 */
function extractColumnInfo(
  columnName: string,
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle column types are complex
  column: any,
): SchemaTableColumn {
  const columnInfo: SchemaTableColumn = {
    name: columnName,
    type: column.dataType || "unknown",
    nullable: column.notNull === false,
    primaryKey: column.primary || false,
  };

  // Extract foreign key information
  if (column.references) {
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle references types are complex
    const refFn = column.references as any;
    if (typeof refFn === "function") {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: Drizzle references return complex types
        const ref: any = refFn();
        if (ref?.table) {
          columnInfo.foreignKey = {
            table: ref.table.name || "unknown",
            column: ref.name || "id",
          };
        }
      } catch {
        // Could not resolve reference
      }
    }
  }

  // Extract default value
  if (column.hasDefault && column.default) {
    columnInfo.defaultValue = String(column.default);
  }

  return columnInfo;
}

/**
 * Extract table information from Drizzle table definition
 */
function extractTableInfo(
  tableName: string,
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle table types are complex
  table: any,
): SchemaTable {
  const columns: SchemaTableColumn[] = [];

  // Extract columns from table definition
  if (table && typeof table === "object") {
    // Get columns from Drizzle table
    const tableColumns = table.columns || table._ || {};

    for (const [colName, colDef] of Object.entries(tableColumns)) {
      if (colDef && typeof colDef === "object") {
        columns.push(extractColumnInfo(colName, colDef));
      }
    }
  }

  return {
    name: tableName,
    columns,
    description: getTableDescription(tableName),
  };
}

/**
 * Get human-readable description for common tables
 */
function getTableDescription(tableName: string): string | undefined {
  const descriptions: Record<string, string> = {
    tenants: "Multi-tenant organizations (accounting firms)",
    users: "Staff users within tenants",
    userSettings: "User preferences and notification settings",
    clients: "Client companies managed by the tenant",
    tasks: "Task tracking and assignments",
    invoices: "Invoices issued to clients",
    timeEntries: "Time tracking entries for billable work",
    workflows: "Workflow templates for task automation",
    workflowStages: "Individual stages within workflows",
    emailTemplates: "Email templates for automated notifications",
    emailQueue: "Pending emails waiting to be sent",
    workflowEmailRules: "Email automation rules for workflow stages",
    services: "Service components for pricing",
    pricingRules: "Pricing configuration for services",
    compliance: "Compliance tracking items",
    documents: "Document storage metadata (S3 references)",
    leads: "Sales leads and pipeline tracking",
    proposals: "Client proposals with pricing",
    departments: "Organizational departments",
    integrations: "External API integration settings",
    notifications: "In-app notifications",
    messages: "Internal messaging system",
    calendarEvents: "Calendar events and meetings",
    clientPortalUsers: "External client portal users",
    clientPortalAccess: "Client portal access control",
  };

  return descriptions[tableName];
}

/**
 * Generate complete database schema documentation
 */
export async function generateSchemaDocs(): Promise<SchemaDocs> {
  const tables: SchemaTable[] = [];
  let totalColumns = 0;

  // Extract all tables from schema
  for (const [tableName, table] of Object.entries(schema)) {
    // Skip non-table exports
    if (
      !table ||
      typeof table !== "object" ||
      !("_" in table || "columns" in table)
    ) {
      continue;
    }

    try {
      const tableInfo = extractTableInfo(tableName, table);
      tables.push(tableInfo);
      totalColumns += tableInfo.columns.length;
    } catch (error) {
      console.error(`Failed to extract table ${tableName}:`, error);
    }
  }

  // Sort tables alphabetically
  tables.sort((a, b) => a.name.localeCompare(b.name));

  return {
    tables,
    generatedAt: new Date().toISOString(),
    totalTables: tables.length,
    totalColumns,
  };
}

/**
 * Generate markdown documentation for database schema
 */
export async function generateSchemaMarkdown(): Promise<string> {
  const docs = await generateSchemaDocs();
  let markdown = `# Practice Hub Database Schema\n\n`;
  markdown += `Generated: ${new Date(docs.generatedAt).toLocaleString()}\n\n`;
  markdown += `**Total Tables:** ${docs.totalTables}  \n`;
  markdown += `**Total Columns:** ${docs.totalColumns}\n\n`;
  markdown += `---\n\n`;
  markdown += `## Table of Contents\n\n`;

  // Generate table of contents
  for (const table of docs.tables) {
    markdown += `- [${table.name}](#${table.name.toLowerCase()})\n`;
  }

  markdown += `\n---\n\n`;

  // Generate detailed table documentation
  for (const table of docs.tables) {
    markdown += `## ${table.name}\n\n`;

    if (table.description) {
      markdown += `${table.description}\n\n`;
    }

    markdown += `| Column | Type | Nullable | Primary Key | Foreign Key | Default |\n`;
    markdown += `|--------|------|----------|-------------|-------------|----------|\n`;

    for (const column of table.columns) {
      const fk = column.foreignKey
        ? `${column.foreignKey.table}.${column.foreignKey.column}`
        : "-";
      markdown += `| ${column.name} | ${column.type} | ${column.nullable ? "✓" : "✗"} | ${column.primaryKey ? "✓" : "✗"} | ${fk} | ${column.defaultValue || "-"} |\n`;
    }

    markdown += `\n`;

    if (table.relationships && table.relationships.length > 0) {
      markdown += `### Relationships\n\n`;
      for (const rel of table.relationships) {
        markdown += `- **${rel.type}**: ${rel.table}`;
        if (rel.description) {
          markdown += ` - ${rel.description}`;
        }
        markdown += `\n`;
      }
      markdown += `\n`;
    }

    markdown += `---\n\n`;
  }

  return markdown;
}

/**
 * Get schema documentation for a specific table
 */
export async function getTableDocs(
  tableName: string,
): Promise<SchemaTable | null> {
  const docs = await generateSchemaDocs();
  return docs.tables.find((t) => t.name === tableName) || null;
}
