import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { proposalServices, proposals } from "@/lib/db/schema";
import { uploadToS3 } from "@/lib/storage/s3";
import {
  type ProposalData,
  ProposalDocument,
  type ProposalService,
} from "./proposal-template";

export interface GeneratePdfOptions {
  proposalId: string;
  companyName?: string;
  preparedBy?: string;
}

export interface GeneratePdfResult {
  pdfUrl: string;
  fileName: string;
}

/**
 * Generate a PDF for a proposal and upload it to S3
 * @param options - Configuration options
 * @returns Public URL of the generated PDF
 */
export async function generateProposalPdf(
  options: GeneratePdfOptions,
): Promise<GeneratePdfResult> {
  const { proposalId, companyName, preparedBy } = options;

  try {
    // 1. Fetch proposal data from database
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    // 2. Fetch proposal services
    const services = await db
      .select()
      .from(proposalServices)
      .where(eq(proposalServices.proposalId, proposalId));

    // 3. Transform data for PDF template
    const proposalData: ProposalData = {
      proposalNumber: proposal.proposalNumber,
      title: proposal.title,
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      industry: proposal.industry,
      turnover: proposal.turnover,
      monthlyTransactions: proposal.monthlyTransactions,
      monthlyTotal: proposal.monthlyTotal,
      annualTotal: proposal.annualTotal,
      pricingModelUsed: proposal.pricingModelUsed,
      termsAndConditions: proposal.termsAndConditions,
      notes: proposal.notes,
      createdAt: proposal.createdAt,
      validUntil: proposal.validUntil,
    };

    const servicesData: ProposalService[] = services.map((service) => ({
      componentName: service.componentName,
      componentCode: service.componentCode,
      calculation: service.calculation,
      price: service.price,
    }));

    // 4. Render PDF to buffer
    console.log("Rendering PDF for proposal:", proposalId);
    const pdfBuffer = await renderToBuffer(
      <ProposalDocument
        proposal={proposalData}
        services={servicesData}
        companyName={companyName}
        preparedBy={preparedBy}
      />,
    );

    // 5. Generate unique filename
    const timestamp = Date.now();
    const fileName = `proposals/${proposalId}/proposal-${proposal.proposalNumber}-${timestamp}.pdf`;

    // 6. Upload to S3
    console.log("Uploading PDF to S3:", fileName);
    const pdfUrl = await uploadToS3({
      fileName,
      buffer: Buffer.from(pdfBuffer),
      contentType: "application/pdf",
      metadata: {
        proposalId,
        proposalNumber: proposal.proposalNumber,
        generatedAt: new Date().toISOString(),
      },
    });

    // 7. Update proposal record with PDF URL
    await db
      .update(proposals)
      .set({
        pdfUrl,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    console.log("PDF generated successfully:", pdfUrl);

    return {
      pdfUrl,
      fileName,
    };
  } catch (error) {
    console.error("Error generating proposal PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Regenerate PDF for a proposal (e.g., after updates)
 * @param proposalId - ID of the proposal
 * @returns Public URL of the regenerated PDF
 */
export async function regenerateProposalPdf(
  proposalId: string,
): Promise<GeneratePdfResult> {
  // For now, just generate a new PDF
  // In the future, we could delete the old PDF from S3 first
  return generateProposalPdf({ proposalId });
}

/**
 * Generate a signed version of the proposal PDF
 * (To be implemented for e-signature workflow)
 */
export async function generateSignedProposalPdf(
  _proposalId: string,
  _signatureData: {
    signerName: string;
    signerEmail: string;
    signatureImageUrl: string;
    signedAt: Date;
  },
): Promise<GeneratePdfResult> {
  // This will be implemented when we add the signed PDF template
  // For now, just return a placeholder
  throw new Error("Signed PDF generation not yet implemented");
}
