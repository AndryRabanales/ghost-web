"use client";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";
import PremiumButton from "@/components/PremiumButton"; // 👈 importa el botón

export default function Dashboard() {
  const params = useParams();
  const dashboardId = params?.dashboardId || params?.id;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Tu Dashboard</h1>

      {/* Botón para activar/desactivar Premium */}
      <PremiumButton />  

      {/* Lista de mensajes */}
      <MessageList dashboardId={dashboardId} />
    </div>
  );
}
