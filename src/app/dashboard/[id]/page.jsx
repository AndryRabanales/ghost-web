"use client";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

export default function DashboardPage() {
  const { id } = useParams(); // dashboardId

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Tu Dashboard</h1>
      <MessageList dashboardId={id} />
    </div>
  );
}
