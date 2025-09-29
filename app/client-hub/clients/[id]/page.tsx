import type { Metadata } from "next";
import ClientDetails from "./client-details";

export const metadata: Metadata = {
  title: "Client Details | Practice Hub",
  description: "View and manage client information",
};

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;

  // In a real app, fetch client data from database here
  // For now, we'll pass the ID to the client component which has the mock data

  return <ClientDetails clientId={id} />;
}
