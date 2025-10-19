/**
 * Lead Scoring Algorithm
 *
 * Calculates a qualification score (1-10) for leads based on multiple factors:
 * - Estimated turnover (revenue potential)
 * - Number of interested services (engagement level)
 * - Industry alignment (strategic fit)
 * - Company size (stability and complexity)
 * - Business type (service potential)
 *
 * Higher scores indicate leads with greater potential value and fit.
 */

export interface LeadScoringInput {
  estimatedTurnover: number;
  estimatedEmployees: number;
  interestedServices: string[];
  industry: string;
  businessType: string;
}

// Industry scoring - industries with higher complexity or better margins score higher
const INDUSTRY_SCORES: Record<string, number> = {
  hospitality: 2.0, // Pubs, hotels, restaurants - high transaction volume
  retail: 1.5,
  "e-commerce": 1.8,
  construction: 1.7,
  professional_services: 1.6,
  technology: 1.8,
  healthcare: 1.5,
  other: 1.0,
};

// Business type scoring - based on service potential and complexity
const BUSINESS_TYPE_SCORES: Record<string, number> = {
  ltd: 2.0, // Limited companies - full accounting services
  limited_company: 2.0,
  partnership: 1.5,
  llp: 1.5,
  sole_trader: 1.0, // Less complex, lower revenue potential
  other: 0.5,
};

// High-value services that indicate serious engagement
const HIGH_VALUE_SERVICES = [
  "Accounts",
  "Management Accounts",
  "Payroll",
  "VAT Returns",
];

/**
 * Calculate turnover score (0-3 points)
 * Based on estimated annual turnover
 */
function calculateTurnoverScore(turnover: number): number {
  if (turnover >= 1000000) return 3.0; // £1M+
  if (turnover >= 500000) return 2.5; // £500K-£1M
  if (turnover >= 250000) return 2.0; // £250K-£500K
  if (turnover >= 100000) return 1.5; // £100K-£250K
  if (turnover >= 50000) return 1.0; // £50K-£100K
  return 0.5; // Under £50K
}

/**
 * Calculate service engagement score (0-2.5 points)
 * Based on number and type of services requested
 */
function calculateServiceScore(interestedServices: string[]): number {
  const serviceCount = interestedServices.length;

  // Base score from service count
  let score = Math.min(serviceCount * 0.3, 1.5);

  // Bonus for high-value services
  const hasHighValueService = interestedServices.some((service) =>
    HIGH_VALUE_SERVICES.some((hvs) => service.includes(hvs)),
  );

  if (hasHighValueService) {
    score += 1.0;
  }

  return Math.min(score, 2.5);
}

/**
 * Calculate company size score (0-1.5 points)
 * Based on number of employees
 */
function calculateSizeScore(employees: number): number {
  if (employees >= 50) return 1.5; // 50+ employees
  if (employees >= 20) return 1.2; // 20-49 employees
  if (employees >= 10) return 1.0; // 10-19 employees
  if (employees >= 5) return 0.7; // 5-9 employees
  if (employees >= 1) return 0.5; // 1-4 employees
  return 0.3; // Sole proprietor
}

/**
 * Calculate industry fit score (0-2 points)
 * Based on strategic industry alignment
 */
function calculateIndustryScore(industry: string): number {
  return INDUSTRY_SCORES[industry] || 1.0;
}

/**
 * Calculate business type score (0-2 points)
 * Based on business structure and complexity
 */
function calculateBusinessTypeScore(businessType: string): number {
  return BUSINESS_TYPE_SCORES[businessType] || 1.0;
}

/**
 * Main scoring function
 * Returns a score from 1-10
 */
export function calculateLeadScore(input: LeadScoringInput): number {
  const turnoverScore = calculateTurnoverScore(input.estimatedTurnover);
  const serviceScore = calculateServiceScore(input.interestedServices);
  const sizeScore = calculateSizeScore(input.estimatedEmployees);
  const industryScore = calculateIndustryScore(input.industry);
  const businessTypeScore = calculateBusinessTypeScore(input.businessType);

  // Total possible: 3 + 2.5 + 1.5 + 2 + 2 = 11 points
  // Normalize to 1-10 scale
  const rawScore =
    turnoverScore +
    serviceScore +
    sizeScore +
    industryScore +
    businessTypeScore;

  // Scale from 11-point range to 10-point range and ensure minimum of 1
  const normalizedScore = Math.max(
    1,
    Math.min(10, Math.ceil((rawScore / 11) * 10)),
  );

  return normalizedScore;
}

/**
 * Get a human-readable qualification level
 */
export function getQualificationLevel(score: number): string {
  if (score >= 9) return "Hot Lead";
  if (score >= 7) return "High Priority";
  if (score >= 5) return "Medium Priority";
  if (score >= 3) return "Low Priority";
  return "Qualify Further";
}

/**
 * Get scoring breakdown for debugging/transparency
 */
export function getScoreBreakdown(input: LeadScoringInput): {
  total: number;
  breakdown: {
    turnover: number;
    services: number;
    size: number;
    industry: number;
    businessType: number;
  };
  level: string;
} {
  const turnoverScore = calculateTurnoverScore(input.estimatedTurnover);
  const serviceScore = calculateServiceScore(input.interestedServices);
  const sizeScore = calculateSizeScore(input.estimatedEmployees);
  const industryScore = calculateIndustryScore(input.industry);
  const businessTypeScore = calculateBusinessTypeScore(input.businessType);

  const total = calculateLeadScore(input);

  return {
    total,
    breakdown: {
      turnover: turnoverScore,
      services: serviceScore,
      size: sizeScore,
      industry: industryScore,
      businessType: businessTypeScore,
    },
    level: getQualificationLevel(total),
  };
}
