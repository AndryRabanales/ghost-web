"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const params = useParams();
  const dashboardId = params?.dashboardId; // /dashboard/[dashboardId]

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar mensajes del dashboard
  const fetchMessages = async () => {
    if (!dashboardId) return;
    try {
      const res = await fetch(`${API}/messages?dashboardId=${dashboardId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [dashboardId]);

  // Marcar como visto (seen = true)
  const handleMarkSeen = async (id) => {
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Error marcando visto:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard de mensajes</h1>
      <MessageList messages={messages} onMarkSeen={handleMarkSeen} />
    </div>
  );
}
