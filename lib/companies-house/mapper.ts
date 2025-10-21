/**
 * Companies House Data Mapper
 *
 * Maps Companies House API responses to Practice Hub database schema.
 * Handles type conversions, field mappings, and edge cases.
 */

import type { CompanyDetails, Officer, PSC } from "./client";

// ============================================================================
// Type Mapping Utilities
// ============================================================================

/**
 * Map Companies House company type to Practice Hub client type enum
 *
 * Companies House Types:
 * - ltd: Private limited company
 * - plc: Public limited company
 * - llp: Limited liability partnership
 * - partnership: Partnership
 * - charitable-incorporated-organisation: Charity
 * - industrial-and-provident-society: Charity/Co-op
 * - limited-partnership: Partnership
 * - old-public-company: Public limited company
 * - private-unlimited: Company
 * - etc.
 *
 * Practice Hub Types:
 * - limited_company
 * - sole_trader
 * - partnership
 * - llp
 * - charity
 * - other
 */
function mapCompanyType(chType: string): string {
  const typeMap: Record<string, string> = {
    ltd: "limited_company",
    plc: "limited_company",
    "old-public-company": "limited_company",
    "private-limited-guarant-nsc-limited-exemption": "limited_company",
    "private-limited-guarant-nsc": "limited_company",
    "private-limited-shares-section-30-exemption": "limited_company",
    "private-unlimited": "limited_company",
    "private-unlimited-nsc": "limited_company",
    llp: "llp",
    "limited-partnership": "partnership",
    partnership: "partnership",
    "scottish-partnership": "partnership",
    "charitable-incorporated-organisation": "charity",
    "industrial-and-provident-society": "charity",
    "registered-society-non-jurisdictional": "charity",
  };

  return typeMap[chType.toLowerCase()] || "other";
}

/**
 * Extract first name from full name
 * Handles edge cases:
 * - Single name: Returns the name as first name
 * - Multiple names: Returns all but last as first name
 * - Empty: Returns empty string
 */
function extractFirstName(fullName: string): string {
  if (!fullName || fullName.trim() === "") {
    return "";
  }

  const parts = fullName.trim().split(/\s+/);

  // Single name - treat as first name
  if (parts.length === 1) {
    return parts[0];
  }

  // Multiple names - all but last is first name
  return parts.slice(0, -1).join(" ");
}

/**
 * Extract last name from full name
 * Handles edge cases:
 * - Single name: Returns empty string
 * - Multiple names: Returns last word as last name
 * - Empty: Returns empty string
 */
function extractLastName(fullName: string): string {
  if (!fullName || fullName.trim() === "") {
    return "";
  }

  const parts = fullName.trim().split(/\s+/);

  // Single name - no last name available
  if (parts.length === 1) {
    return "";
  }

  // Multiple names - last word is last name
  return parts[parts.length - 1];
}

// ============================================================================
// Mapper Functions
// ============================================================================

/**
 * Map Companies House company details to Practice Hub client schema
 *
 * @param company - Company details from Companies House API
 * @returns Mapped client data ready for database insertion
 *
 * @example
 * ```typescript
 * const company = await getCompany("00000006");
 * const clientData = mapCompanyToClient(company);
 * // Insert into clients table with tenantId
 * ```
 */
export function mapCompanyToClient(company: CompanyDetails) {
  return {
    name: company.companyName,
    registrationNumber: company.companyNumber,
    type: mapCompanyType(company.type),
    status: company.status === "active" ? "active" : "inactive",
    addressLine1: company.registeredOffice.addressLine1 || "",
    addressLine2: company.registeredOffice.addressLine2 || null,
    city: company.registeredOffice.locality || "",
    postalCode: company.registeredOffice.postalCode || "",
    country: company.registeredOffice.country || "",
    incorporationDate: company.dateOfCreation,
  };
}

/**
 * Map Companies House officers to Practice Hub client contacts
 *
 * Note: Companies House does not provide email or phone numbers.
 * These fields are left empty and should be collected manually.
 *
 * @param officers - Officers array from Companies House API
 * @returns Array of mapped contact data ready for database insertion
 *
 * @example
 * ```typescript
 * const officers = await getOfficers("00000006");
 * const contacts = mapOfficersToContacts(officers);
 * // Insert into clientContacts table with tenantId and clientId
 * ```
 */
export function mapOfficersToContacts(officers: Officer[]) {
  if (!officers || officers.length === 0) {
    return [];
  }

  return officers.map((officer) => ({
    firstName: extractFirstName(officer.name),
    lastName: extractLastName(officer.name),
    position: officer.role,
    email: "", // Not available from Companies House
    phone: "", // Not available from Companies House
  }));
}

/**
 * Map Companies House PSCs to Practice Hub client PSCs
 *
 * @param pscs - PSCs array from Companies House API
 * @returns Array of mapped PSC data ready for database insertion
 *
 * @example
 * ```typescript
 * const pscs = await getPSCs("00000006");
 * const pscData = mapPSCsToPSCs(pscs);
 * // Insert into clientPSCs table with tenantId and clientId
 * ```
 */
export function mapPSCsToPSCs(pscs: PSC[]) {
  if (!pscs || pscs.length === 0) {
    return [];
  }

  return pscs.map((psc) => ({
    name: psc.name,
    notifiedOn: psc.notifiedOn,
    natureOfControl: psc.natureOfControl.join(", "),
    kind: psc.kind,
  }));
}
