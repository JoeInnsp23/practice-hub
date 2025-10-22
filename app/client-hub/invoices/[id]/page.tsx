import type { Metadata } from "next";
import { InvoiceDetail } from "./invoice-detail";

export const metadata: Metadata = {
  title: "Invoice Details | Practice Hub",
  description: "View and manage invoice details",
};

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;

  return <InvoiceDetail invoiceId={id} />;
}
