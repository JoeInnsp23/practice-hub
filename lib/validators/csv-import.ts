/**
 * CSV Import Validators
 *
 * Zod schemas for validating CSV import data
 * - Client import validation
 * - Task import validation
 * - Service import validation
 */

import { z } from "zod";

// ============================================
// Client Import Schema
// ============================================

export const clientImportSchema = z.object({
  // Required fields
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),

  // Optional contact fields
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),

  // Optional address fields
  address_line1: z.string().optional().or(z.literal("")),
  address_line2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),

  // Business details
  client_type: z
    .enum([
      "individual",
      "company",
      "limited_company",
      "sole_trader",
      "partnership",
      "llp",
      "trust",
      "charity",
      "other",
    ])
    .optional()
    .or(z.literal("")),
  company_number: z.string().optional().or(z.literal("")),
  vat_number: z.string().optional().or(z.literal("")),
  utr_number: z.string().optional().or(z.literal("")),

  // Financial details
  turnover: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .pipe(z.number().nonnegative("Turnover must be positive").optional())
    .or(z.literal("")),
  employee_count: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(
      z
        .number()
        .int()
        .nonnegative("Employee count must be a positive integer")
        .optional(),
    )
    .or(z.literal("")),

  // Status
  status: z
    .enum(["prospect", "onboarding", "active", "inactive", "archived"])
    .optional()
    .or(z.literal("")),

  // Notes
  notes: z.string().optional().or(z.literal("")),
});

export type ClientImportData = z.infer<typeof clientImportSchema>;

// ============================================
// Task Import Schema
// ============================================

export const taskImportSchema = z.object({
  // Required fields
  title: z.string().min(1, "Task title is required"),
  client_code: z.string().min(1, "Client code is required"),

  // Optional fields
  description: z.string().optional().or(z.literal("")),
  status: z
    .enum([
      "pending",
      "in_progress",
      "review",
      "completed",
      "cancelled",
      "blocked",
      "records_received",
      "queries_sent",
      "queries_received",
    ])
    .optional()
    .or(z.literal("")),
  priority: z
    .enum(["low", "medium", "high", "urgent", "critical"])
    .optional()
    .or(z.literal("")),

  // Dates
  due_date: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return undefined;
      const date = new Date(val);
      return Number.isNaN(date.getTime())
        ? undefined
        : date.toISOString().split("T")[0];
    })
    .or(z.literal("")),
  start_date: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return undefined;
      const date = new Date(val);
      return Number.isNaN(date.getTime())
        ? undefined
        : date.toISOString().split("T")[0];
    })
    .or(z.literal("")),

  // Assignment
  assigned_to_email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  reviewer_email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),

  // Hours
  estimated_hours: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .pipe(z.number().positive("Estimated hours must be positive").optional())
    .or(z.literal("")),
  actual_hours: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .pipe(
      z.number().nonnegative("Actual hours must be non-negative").optional(),
    )
    .or(z.literal("")),

  // Type
  task_type: z.string().optional().or(z.literal("")),

  // Notes
  notes: z.string().optional().or(z.literal("")),
});

export type TaskImportData = z.infer<typeof taskImportSchema>;

// ============================================
// Service Import Schema
// ============================================

export const serviceImportSchema = z.object({
  // Required fields
  name: z.string().min(1, "Service name is required"),
  code: z.string().min(1, "Service code is required"),

  // Optional fields
  description: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),

  // Pricing
  price: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .pipe(z.number().nonnegative("Price must be non-negative").optional())
    .or(z.literal("")),
  price_type: z
    .enum(["fixed", "hourly", "monthly", "annual", "custom"])
    .optional()
    .or(z.literal("")),

  // Time estimates
  estimated_hours: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .pipe(z.number().positive("Estimated hours must be positive").optional())
    .or(z.literal("")),

  // Status
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return true;
      return (
        val.toLowerCase() === "true" ||
        val === "1" ||
        val.toLowerCase() === "yes"
      );
    })
    .or(z.literal("")),
  is_taxable: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return true;
      return (
        val.toLowerCase() === "true" ||
        val === "1" ||
        val.toLowerCase() === "yes"
      );
    })
    .or(z.literal("")),

  // Tax rate (percentage)
  tax_rate: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .pipe(
      z
        .number()
        .min(0, "Tax rate must be between 0 and 100")
        .max(100, "Tax rate must be between 0 and 100")
        .optional(),
    )
    .or(z.literal("")),

  // Notes
  notes: z.string().optional().or(z.literal("")),
});

export type ServiceImportData = z.infer<typeof serviceImportSchema>;

// ============================================
// CSV Template Field Definitions
// ============================================

export const CLIENT_CSV_FIELDS = [
  "name",
  "email",
  "phone",
  "website",
  "address_line1",
  "address_line2",
  "city",
  "county",
  "postal_code",
  "country",
  "client_type",
  "company_number",
  "vat_number",
  "utr_number",
  "turnover",
  "employee_count",
  "status",
  "notes",
];

export const TASK_CSV_FIELDS = [
  "title",
  "client_code",
  "description",
  "status",
  "priority",
  "due_date",
  "start_date",
  "assigned_to_email",
  "reviewer_email",
  "estimated_hours",
  "actual_hours",
  "task_type",
  "notes",
];

export const SERVICE_CSV_FIELDS = [
  "name",
  "code",
  "description",
  "category",
  "price",
  "price_type",
  "estimated_hours",
  "is_active",
  "is_taxable",
  "tax_rate",
  "notes",
];

// ============================================
// Example Data for Templates
// ============================================

export const CLIENT_EXAMPLE_DATA: Record<string, string> = {
  name: "ABC Manufacturing Ltd",
  email: "contact@abc-manufacturing.co.uk",
  phone: "+44 20 1234 5678",
  website: "https://abc-manufacturing.co.uk",
  address_line1: "123 Industrial Estate",
  address_line2: "Unit 5",
  city: "London",
  county: "Greater London",
  postal_code: "SW1A 1AA",
  country: "United Kingdom",
  client_type: "limited_company",
  company_number: "12345678",
  vat_number: "GB123456789",
  utr_number: "1234567890",
  turnover: "500000",
  employee_count: "25",
  status: "active",
  notes: "Long-standing client since 2020",
};

export const TASK_EXAMPLE_DATA: Record<string, string> = {
  title: "Prepare Annual Accounts",
  client_code: "ABC001",
  description: "Prepare and file annual accounts for year ending 31/12/2024",
  status: "pending",
  priority: "high",
  due_date: "2025-01-31",
  start_date: "2025-01-15",
  assigned_to_email: "accountant@firm.com",
  reviewer_email: "manager@firm.com",
  estimated_hours: "8",
  actual_hours: "",
  task_type: "accounts",
  notes: "Ensure all supporting documents are collected first",
};

export const SERVICE_EXAMPLE_DATA: Record<string, string> = {
  name: "Annual Accounts Preparation",
  code: "ACC_ANNUAL",
  description: "Preparation and filing of annual statutory accounts",
  category: "Compliance",
  price: "500.00",
  price_type: "fixed",
  estimated_hours: "8",
  is_active: "true",
  is_taxable: "true",
  tax_rate: "20",
  notes: "Includes Companies House filing",
};
