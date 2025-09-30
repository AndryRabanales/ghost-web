"use client";
import React from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

export default function DashboardPage() {
  const { id } = useParams(); // ✅ usamos "id" porque la carpeta es [id]

  if (!id) return <p>Cargando dashboard…</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>Dashboard</h1>
      <MessageList dashboardId={id} />
    </div>
  );
}
