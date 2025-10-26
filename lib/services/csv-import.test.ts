import { describe, expect, it } from "vitest";
import { UTF8_BOM } from "../utils/csv-parser-enhanced";
import {
  CLIENT_CSV_FIELDS,
  CLIENT_EXAMPLE_DATA,
  clientImportSchema,
  SERVICE_CSV_FIELDS,
  SERVICE_EXAMPLE_DATA,
  serviceImportSchema,
  TASK_CSV_FIELDS,
  TASK_EXAMPLE_DATA,
  taskImportSchema,
  USER_CSV_FIELDS,
  USER_EXAMPLE_DATA,
  userImportSchema,
} from "../validators/csv-import";
import { generateCsvTemplate, parseCsvFile } from "./csv-import";

describe("CSV Import Service", () => {
  describe("generateCsvTemplate", () => {
    it("should generate template with headers only", () => {
      const template = generateCsvTemplate(CLIENT_CSV_FIELDS, false);

      expect(template).toBe(CLIENT_CSV_FIELDS.join(","));
      expect(template.split("\n")).toHaveLength(1);
    });

    it("should generate template with headers and example row", () => {
      const template = generateCsvTemplate(
        CLIENT_CSV_FIELDS,
        true,
        CLIENT_EXAMPLE_DATA,
      );

      const lines = template.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe(CLIENT_CSV_FIELDS.join(","));
      expect(lines[1]).toContain("ABC Manufacturing Ltd");
    });

    it("should generate service template correctly", () => {
      const template = generateCsvTemplate(
        SERVICE_CSV_FIELDS,
        true,
        SERVICE_EXAMPLE_DATA,
      );

      const lines = template.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain("name");
      expect(lines[0]).toContain("code");
      expect(lines[1]).toContain("Annual Accounts Preparation");
    });

    it("should generate task template correctly", () => {
      const template = generateCsvTemplate(
        TASK_CSV_FIELDS,
        true,
        TASK_EXAMPLE_DATA,
      );

      const lines = template.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain("title");
      expect(lines[0]).toContain("client_code");
    });

    it("should generate user template correctly", () => {
      const template = generateCsvTemplate(
        USER_CSV_FIELDS,
        true,
        USER_EXAMPLE_DATA,
      );

      const lines = template.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain("email");
      expect(lines[0]).toContain("first_name");
      expect(lines[1]).toContain("john.smith@firm.com");
    });

    it("should handle empty example data", () => {
      const template = generateCsvTemplate(CLIENT_CSV_FIELDS, true, {});

      const lines = template.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe(CLIENT_CSV_FIELDS.map(() => "").join(","));
    });
  });

  describe("parseCsvFile", () => {
    describe("Client CSV Parsing", () => {
      it("should parse valid client CSV data", async () => {
        const csvContent = `name,email,phone,client_type,status
ABC Manufacturing Ltd,contact@abc.com,+441234567890,limited_company,active
XYZ Services Ltd,info@xyz.com,,company,prospect`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.meta.validRows).toBe(2);
        expect(result.meta.invalidRows).toBe(0);
        expect(result.errors).toHaveLength(0);

        expect(result.data[0].name).toBe("ABC Manufacturing Ltd");
        expect(result.data[0].email).toBe("contact@abc.com");
        expect(result.data[1].name).toBe("XYZ Services Ltd");
      });

      it("should validate required fields for clients", async () => {
        const csvContent = `name,email,phone
,invalid-email,1234`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(0);
        expect(result.meta.validRows).toBe(0);
        expect(result.meta.invalidRows).toBe(1);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain("required");
      });

      it("should validate email format for clients", async () => {
        const csvContent = `name,email
ABC Ltd,invalid-email`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.meta.validRows).toBe(0);
        expect(result.errors.some((e) => e.message.includes("email"))).toBe(
          true,
        );
      });
    });

    describe("Service CSV Parsing", () => {
      it("should parse valid service CSV data", async () => {
        const csvContent = `name,code,category,price,price_type,is_active
Annual Accounts,ACC_ANNUAL,compliance,500.00,fixed,true
Bookkeeping,BOOK_BASIC,bookkeeping,250.00,monthly,true`;

        const result = await parseCsvFile(csvContent, serviceImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.meta.validRows).toBe(2);
        expect(result.errors).toHaveLength(0);

        expect(result.data[0].name).toBe("Annual Accounts");
        expect(result.data[0].code).toBe("ACC_ANNUAL");
        expect(result.data[0].price).toBe(500);
      });

      it("should validate required fields for services", async () => {
        const csvContent = `name,code
,`;

        const result = await parseCsvFile(csvContent, serviceImportSchema);

        expect(result.meta.validRows).toBe(0);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it("should parse numeric fields correctly", async () => {
        const csvContent = `name,code,price,estimated_hours
Test Service,TEST_SVC,150.50,8.5`;

        const result = await parseCsvFile(csvContent, serviceImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].price).toBe(150.5);
        expect(result.data[0].estimated_hours).toBe(8.5);
      });

      it("should parse boolean fields correctly", async () => {
        const csvContent = `name,code,is_active,is_taxable
Service 1,SVC1,true,yes
Service 2,SVC2,false,no
Service 3,SVC3,1,0`;

        const result = await parseCsvFile(csvContent, serviceImportSchema);

        expect(result.data).toHaveLength(3);
        expect(result.data[0].is_active).toBe(true);
        expect(result.data[0].is_taxable).toBe(true);
        expect(result.data[1].is_active).toBe(false);
        expect(result.data[1].is_taxable).toBe(false);
        expect(result.data[2].is_active).toBe(true);
        expect(result.data[2].is_taxable).toBe(false);
      });
    });

    describe("Task CSV Parsing", () => {
      it("should parse valid task CSV data", async () => {
        const csvContent = `title,client_code,status,priority,due_date
Prepare Accounts,ABC001,pending,high,2025-01-31
File VAT Return,XYZ002,in_progress,medium,2025-02-15`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.meta.validRows).toBe(2);
        expect(result.data[0].title).toBe("Prepare Accounts");
        expect(result.data[0].due_date).toBe("2025-01-31");
      });

      it("should validate required fields for tasks", async () => {
        const csvContent = `title,client_code
,`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.meta.validRows).toBe(0);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe("User CSV Parsing", () => {
      it("should parse valid user CSV data", async () => {
        const csvContent = `email,first_name,last_name,role,status
john.smith@firm.com,John,Smith,accountant,active
jane.doe@firm.com,Jane,Doe,admin,active`;

        const result = await parseCsvFile(csvContent, userImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.meta.validRows).toBe(2);
        expect(result.data[0].email).toBe("john.smith@firm.com");
        expect(result.data[0].role).toBe("accountant");
      });

      it("should validate email format for users", async () => {
        const csvContent = `email,first_name,last_name
invalid-email,John,Smith`;

        const result = await parseCsvFile(csvContent, userImportSchema);

        expect(result.meta.validRows).toBe(0);
        expect(result.errors.some((e) => e.message.includes("email"))).toBe(
          true,
        );
      });

      it("should validate required fields for users", async () => {
        const csvContent = `email,first_name,last_name
test@example.com,,Smith`;

        const result = await parseCsvFile(csvContent, userImportSchema);

        expect(result.meta.validRows).toBe(0);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe("Error Handling", () => {
      it("should handle empty CSV files", async () => {
        const csvContent = ``;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(0);
        expect(result.meta.totalRows).toBe(0);
      });

      it("should handle CSV with headers only", async () => {
        const csvContent = `name,email,phone`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(0);
        expect(result.meta.totalRows).toBe(0);
      });

      it("should skip empty rows", async () => {
        const csvContent = `name,email
ABC Ltd,contact@abc.com

XYZ Ltd,info@xyz.com`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.meta.skippedRows).toBe(1);
      });

      it("should handle mixed valid and invalid rows", async () => {
        const csvContent = `name,email
ABC Ltd,valid@email.com
,invalid-email
XYZ Ltd,another@valid.com`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.meta.validRows).toBe(2);
        expect(result.meta.invalidRows).toBe(1);
        expect(result.errors).toHaveLength(2); // Missing name + invalid email
      });

      it("should provide row numbers in error messages", async () => {
        const csvContent = `name,email
ABC Ltd,invalid-email`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.errors[0].row).toBe(2); // Row 2 (after header)
      });

      it("should provide field names in error messages", async () => {
        const csvContent = `name,email
ABC Ltd,invalid-email`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.errors[0].field).toBe("email");
      });
    });

    // ============================================
    // Enhanced CSV Parser Tests (Story 5.2)
    // ============================================

    describe("BOM Handling (AC5)", () => {
      it("should handle UTF-8 BOM prefix", async () => {
        const csvContent = `${UTF8_BOM}name,email
ABC Ltd,contact@abc.com`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          stripBOM: true,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("ABC Ltd");
      });

      it("should strip BOM by default", async () => {
        const csvContent = `${UTF8_BOM}name,email
ABC Ltd,contact@abc.com`;

        const result = await parseCsvFile(csvContent, clientImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.meta.validRows).toBe(1);
      });

      it("should handle CSV without BOM", async () => {
        const csvContent = `name,email
ABC Ltd,contact@abc.com`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          stripBOM: true,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("ABC Ltd");
      });
    });

    describe("Multi-Delimiter Support (AC1, AC2)", () => {
      it("should parse semicolon-delimited CSV", async () => {
        const csvContent = `name;email;phone
ABC Ltd;contact@abc.com;+441234567890
XYZ Ltd;info@xyz.com;+449876543210`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          autoDetectDelimiter: true,
        });

        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe("ABC Ltd");
        expect(result.data[0].email).toBe("contact@abc.com");
        expect(result.data[1].name).toBe("XYZ Ltd");
      });

      it("should parse tab-delimited CSV", async () => {
        const csvContent = `name\temail\tphone
ABC Ltd\tcontact@abc.com\t+441234567890
XYZ Ltd\tinfo@xyz.com\t+449876543210`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          autoDetectDelimiter: true,
        });

        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe("ABC Ltd");
        expect(result.data[1].name).toBe("XYZ Ltd");
      });

      it("should use explicit delimiter if provided", async () => {
        const csvContent = `name;email
ABC Ltd;contact@abc.com`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          delimiter: ";",
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("ABC Ltd");
      });

      it("should auto-detect delimiter without explicit option", async () => {
        const csvContent = `name;email;phone
ABC Ltd;contact@abc.com;123`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          autoDetectDelimiter: true,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].email).toBe("contact@abc.com");
      });
    });

    describe("Date Format Support (AC3, AC4)", () => {
      it("should parse UK date format (DD/MM/YYYY)", async () => {
        const csvContent = `title,client_code,due_date
Task 1,ABC001,31/12/2025`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].due_date).toBe("2025-12-31");
      });

      it("should parse ISO date format (YYYY-MM-DD)", async () => {
        const csvContent = `title,client_code,due_date
Task 1,ABC001,2025-12-31`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].due_date).toBe("2025-12-31");
      });

      it("should parse US date format (MM/DD/YYYY)", async () => {
        const csvContent = `title,client_code,due_date
Task 1,ABC001,12/31/2025`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].due_date).toBe("2025-12-31");
      });

      it("should parse hyphenated UK format (DD-MM-YYYY)", async () => {
        const csvContent = `title,client_code,due_date
Task 1,ABC001,31-12-2025`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].due_date).toBe("2025-12-31");
      });

      it("should handle mixed date formats in same CSV", async () => {
        const csvContent = `title,client_code,due_date,start_date
Task 1,ABC001,31/12/2025,2025-01-15
Task 2,ABC002,12/31/2025,15-01-2025`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(2);
        expect(result.data[0].due_date).toBe("2025-12-31");
        expect(result.data[0].start_date).toBe("2025-01-15");
        expect(result.data[1].due_date).toBe("2025-12-31");
        expect(result.data[1].start_date).toBe("2025-01-15");
      });
    });

    describe("Combined Enhancement Tests", () => {
      it("should handle BOM + semicolon delimiter + date formats", async () => {
        const csvContent = `${UTF8_BOM}title;client_code;due_date
Task 1;ABC001;31/12/2025
Task 2;ABC002;2025-12-31`;

        const result = await parseCsvFile(csvContent, taskImportSchema, {
          stripBOM: true,
          autoDetectDelimiter: true,
        });

        expect(result.data).toHaveLength(2);
        expect(result.data[0].title).toBe("Task 1");
        expect(result.data[0].due_date).toBe("2025-12-31");
        expect(result.data[1].due_date).toBe("2025-12-31");
      });

      it("should handle tab-delimited with BOM", async () => {
        const csvContent = `${UTF8_BOM}name\temail\tphone
ABC Ltd\tcontact@abc.com\t123`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          autoDetectDelimiter: true,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("ABC Ltd");
      });

      it("should handle real-world Excel CSV export (semicolons + quotes)", async () => {
        const csvContent = `name;email;address_line1
"ABC Ltd";"contact@abc.com";"123 Main St, Suite 5"
"XYZ Corp";"info@xyz.com";"456 High St, Floor 2"`;

        const result = await parseCsvFile(csvContent, clientImportSchema, {
          autoDetectDelimiter: true,
        });

        expect(result.data).toHaveLength(2);
        expect(result.data[0].address_line1).toBe("123 Main St, Suite 5");
        expect(result.data[1].address_line1).toBe("456 High St, Floor 2");
      });
    });

    describe("Task Import with service_name (AC10)", () => {
      it("should accept service_name field", async () => {
        const csvContent = `title,client_code,service_name
Task 1,ABC001,Annual Accounts`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("Task 1");
        expect(result.data[0].service_name).toBe("Annual Accounts");
      });

      it("should handle missing service_name (optional)", async () => {
        const csvContent = `title,client_code,service_name
Task 1,ABC001,`;

        const result = await parseCsvFile(csvContent, taskImportSchema);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].service_name).toBe("");
      });
    });
  });
});
