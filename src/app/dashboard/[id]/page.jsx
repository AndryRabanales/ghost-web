"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API || "http://localhost:3001";

export default function DashboardPage() {
  const { id } = useParams(); // dashboardId de la URL
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // obtener mensajes del dashboard actual
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/messages?dashboardId=${id}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMessages();
  }, [id]);

  // cambiar estado o visto
  const handleSeenToggle = async (messageId, seen) => {
    try {
      await fetch(`${API}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Error actualizando mensaje:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Mi Dashboard</h1>
      <MessageList messages={messages} onSeenToggle={handleSeenToggle} />
    </div>
  );
}
