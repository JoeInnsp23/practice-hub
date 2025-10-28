import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Register fonts (optional - using default Helvetica for now)
// You can add custom fonts later if needed

// Color scheme matching the example PDF
const COLORS = {
  primary: "#FF8534", // Orange
  background: "#F5F2ED", // Light cream/beige
  text: "#000000", // Black
  textSecondary: "#4A4A4A", // Dark gray
  white: "#FFFFFF",
  border: "#E0DDD8",
};

// PDF styles
const styles = StyleSheet.create({
  // Page layouts
  coverPage: {
    backgroundColor: COLORS.primary,
    padding: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  contentPage: {
    backgroundColor: COLORS.background,
    padding: 60,
  },

  // Typography
  coverTitle: {
    fontSize: 72,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 30,
  },
  coverSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  coverPreparedBy: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "bold",
    marginTop: "auto",
  },

  h1: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 24,
  },
  h3: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  body: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  bodyBold: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: "bold",
    lineHeight: 1.6,
  },

  // Layout components
  section: {
    marginBottom: 20,
  },
  paragraph: {
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 20,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletPoint: {
    width: 15,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },

  // Tables
  table: {
    width: "100%",
    marginTop: 12,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 10,
    color: COLORS.white,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 10,
    minHeight: 35,
  },
  tableCell: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  tableCellHeader: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: "bold",
  },

  // Pricing table columns
  col1: { width: "50%" },
  col2: { width: "20%" },
  col3: { width: "15%" },
  col4: { width: "15%", textAlign: "right" },

  // Service description table
  colService: { width: "30%", fontWeight: "bold" },
  colDescription: { width: "70%" },

  // Total row
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    backgroundColor: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  totalLabel: {
    width: "70%",
    textAlign: "right",
    paddingRight: 20,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  totalAmount: {
    width: "15%",
    textAlign: "right",
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },

  // Signature section
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
    width: "50%",
    marginTop: 40,
    marginBottom: 10,
  },
  signatureText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});

// Types
export interface ProposalService {
  componentName: string;
  componentCode: string;
  calculation?: string | null;
  price: string | number;
}

export interface ProposalData {
  proposalNumber: string;
  title: string;
  clientName?: string | null;
  clientEmail?: string | null;
  industry?: string | null;
  turnover?: string | null;
  monthlyTransactions?: number | null;
  monthlyTotal: string | number;
  annualTotal: string | number;
  pricingModelUsed?: string | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  validUntil?: Date | string | null;
}

export interface ProposalDocumentProps {
  proposal: ProposalData;
  services: ProposalService[];
  companyName?: string;
  preparedBy?: string;
}

// Helper functions
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `£${num.toFixed(2)}`;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Main PDF Document Component
export function ProposalDocument({
  proposal,
  services,
  companyName = "Innspired Accountancy",
  preparedBy = "Joseph Stephenson-Mouzo, Managing Director",
}: ProposalDocumentProps) {
  return (
    <Document>
      {/* Page 1: Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverTitle}>Proposal</Text>
          <Text style={styles.coverSubtitle}>
            This document outlines the services, pricing, and deliverables as
            requested by {proposal.clientName || "[Client Name]"}.
          </Text>
        </View>
        <View>
          <Text style={styles.coverPreparedBy}>
            This proposal was prepared by:{"\n"}
            {preparedBy}
          </Text>
        </View>
      </Page>

      {/* Page 2: Company Overview */}
      <Page size="A4" style={styles.contentPage}>
        <Text style={styles.h1}>Company Overview</Text>

        <View style={styles.section}>
          <Text style={styles.h3}>About Us</Text>
          <Text style={styles.body}>
            {companyName} was founded with a clear mission: to provide
            specialised accounting and financial services to the hospitality
            industry. With over 10 years of experience, we have developed a deep
            understanding of the unique financial challenges faced by pubs,
            hotels, restaurants, and other hospitality businesses.
          </Text>
          <Text style={styles.body}>
            The fast-paced nature of hospitality requires precise financial
            management and modern technology solutions. We embrace the latest
            advancements in cloud accounting, automation, and AI-driven
            analytics to streamline financial processes, improve efficiency, and
            empower businesses with real-time financial insights.
          </Text>
          <Text style={styles.body}>
            Our expertise, while rooted in the hospitality sector, extends far
            beyond it. We proudly serve clients across diverse industries,
            leveraging the knowledge and insights gained from hospitality to
            deliver exceptional, tailored accounting services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h3}>Our Mission</Text>
          <Text style={styles.body}>
            To simplify financial management for hospitality businesses by
            combining expert guidance with cutting-edge technology—allowing
            owners to focus on growth and delivering exceptional customer
            experiences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h3}>Why Choose Us?</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Hospitality finance experts with over a decade of
                industry-specific experience
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Technology-driven solutions integrating cloud accounting,
                automation, and AI
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Fixed, transparent pricing with no hidden costs
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Cloud-based efficiency with real-time access to financials via
                our secure client portal
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Proactive and strategic approach to help businesses leverage
                technology for smarter decision-making
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Page 3: Proposal Overview & Pricing */}
      <Page size="A4" style={styles.contentPage}>
        <Text style={styles.h1}>Proposal Overview</Text>

        <Text style={styles.body}>
          This proposal is designed to streamline your financial operations,
          ensure compliance, and drive long-term profitability. Tailored for
          your business needs, it integrates cloud-based accounting, proactive
          tax planning, and comprehensive financial management.
        </Text>

        <Text style={styles.body}>
          With quick and hassle-free onboarding, we ensure minimal disruption,
          and our team is always available to support you throughout the
          transition.
        </Text>

        <View style={styles.section}>
          <Text style={styles.h2}>Terms and Pricing</Text>
          <Text style={styles.body}>
            Below is a detailed outline of the financial terms for{" "}
            {proposal.clientName || "[Client Name]"}. This quote provides a
            clear breakdown of the costs and services included.
          </Text>

          {/* Pricing Table */}
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.col1]}>Service</Text>
              <Text style={[styles.tableCellHeader, styles.col2]}>Price</Text>
              <Text style={[styles.tableCellHeader, styles.col3]}>QTY</Text>
              <Text style={[styles.tableCellHeader, styles.col4]}>
                Subtotal
              </Text>
            </View>

            {/* Services */}
            {services.map((service) => (
              <View key={service.componentCode} style={styles.tableRow}>
                <View style={styles.col1}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                    {service.componentName}
                  </Text>
                  {service.calculation && (
                    <Text
                      style={[styles.tableCell, { fontSize: 9, marginTop: 2 }]}
                    >
                      {service.calculation}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.col2]}>
                  {formatCurrency(service.price)}
                </Text>
                <Text style={[styles.tableCell, styles.col3]}>1</Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {formatCurrency(service.price)}
                </Text>
              </View>
            ))}

            {/* Monthly Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Monthly fee (inc. VAT)</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(proposal.monthlyTotal)}
              </Text>
            </View>

            {/* Annual Total */}
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, styles.totalLabel]}>
                Annual Total (inc. VAT)
              </Text>
              <Text
                style={[styles.bodyBold, styles.totalAmount, { fontSize: 14 }]}
              >
                {formatCurrency(proposal.annualTotal)}
              </Text>
            </View>
          </View>

          {/* Pricing Details */}
          {(proposal.pricingModelUsed ||
            proposal.industry ||
            proposal.turnover) && (
            <View style={[styles.section, { marginTop: 20 }]}>
              <Text style={styles.h3}>Pricing Details</Text>
              {proposal.pricingModelUsed && (
                <Text style={styles.body}>
                  Pricing Model: Model {proposal.pricingModelUsed}
                </Text>
              )}
              {proposal.industry && (
                <Text style={styles.body}>Industry: {proposal.industry}</Text>
              )}
              {proposal.turnover && (
                <Text style={styles.body}>Turnover: {proposal.turnover}</Text>
              )}
              {proposal.monthlyTransactions && (
                <Text style={styles.body}>
                  Monthly Transactions:{" "}
                  {proposal.monthlyTransactions.toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>
      </Page>

      {/* Page 4: Terms & Agreement */}
      <Page size="A4" style={styles.contentPage}>
        <Text style={styles.h1}>Terms & Conditions</Text>

        {proposal.termsAndConditions ? (
          <Text style={styles.body}>{proposal.termsAndConditions}</Text>
        ) : (
          <View>
            <Text style={styles.body}>
              This proposal is valid for 30 days from the date of issue. All
              prices are inclusive of VAT where applicable.
            </Text>
            <Text style={styles.body}>
              Payment terms: Monthly fees are payable in advance by direct
              debit. Initial setup fees are payable upon acceptance of this
              proposal.
            </Text>
            <Text style={styles.body}>
              Services commence upon receipt of all necessary documentation and
              access to accounting systems.
            </Text>
          </View>
        )}

        {/* Agreement Section */}
        <View style={styles.signatureSection}>
          <Text style={styles.h2}>Agreement</Text>
          <Text style={styles.body}>
            By signing the document below, you agree to the terms of this
            proposal and form a contractual agreement that begins upon the date
            of your signing.
          </Text>

          <View style={{ marginTop: 40 }}>
            <Text style={styles.signatureText}>{preparedBy}</Text>
            <Text style={styles.signatureText}>{companyName}</Text>
            <Text style={[styles.signatureText, { marginTop: 10 }]}>
              Proposal Number: {proposal.proposalNumber}
            </Text>
            <Text style={styles.signatureText}>
              Date: {formatDate(proposal.createdAt)}
            </Text>
            {proposal.validUntil && (
              <Text style={styles.signatureText}>
                Valid Until: {formatDate(proposal.validUntil)}
              </Text>
            )}
          </View>

          {/* Client Signature Space */}
          <View style={{ marginTop: 50 }}>
            <Text style={styles.bodyBold}>Client Signature:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Name:</Text>
            <Text style={styles.signatureText}>Date:</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
