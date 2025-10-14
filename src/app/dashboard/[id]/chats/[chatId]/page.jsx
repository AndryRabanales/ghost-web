// src/app/dashboard/[id]/chats/[chatId]/page.jsx
"use client";
import { useParams, useRouter } from "next/navigation";
import ChatDetail from "@/components/ChatDetail";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: dashboardId, chatId } = params;

  return (
    // CAMBIO: Ajustado a 520px para coincidir con la vista anónima
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "20px" }}>
      <ChatDetail 
          dashboardId={dashboardId} 
          chatId={chatId} 
          onBack={() => router.push(`/dashboard/${dashboardId}`)}
      />
    </div>
  );
}