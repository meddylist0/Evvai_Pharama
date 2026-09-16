import React from "react";
import { INITIAL_ORDERS } from "@/data/mockData";
import { AdminOrderDetailClientView } from "@/components/admin/AdminOrderDetailClientView";

// Required for Next.js static HTML export (output: 'export')
export async function generateStaticParams() {
  const staticIds = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "15", "20", "25", "30", "50", "100",
    ...INITIAL_ORDERS.map((o) => o.id),
  ];
  return Array.from(new Set(staticIds)).map((id) => ({
    id: String(id),
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminOrderDetailClientView orderId={id} />;
}
