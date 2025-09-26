"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Para tomar el dashboardId de la URL
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const params = useParams();
  const dashboardId = params?.id; // si estás en /dashboard/[id]
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleToggleSeen = async (id, seen) => {
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen }), // actualizar campo seen en el backend
      });
      fetchMessages(); // refrescar lista
    } catch (err) {
      console.error("Error actualizando visto:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard de mensajes</h1>
      <MessageList messages={messages} onToggleSeen={handleToggleSeen} />
    </div>
  );
}
