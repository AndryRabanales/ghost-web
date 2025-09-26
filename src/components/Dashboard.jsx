"use client";
import React, { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

const API = "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const dashboardId = "AQUÍ_EL_ID_DEL_CREATOR"; // O recupera de URL/estado

  const fetchMessages = async () => {
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
  }, []);

  // 👇 marcar como visto en BD
  const handleMarkSeen = async (id) => {
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Error marcando como visto:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard de mensajes</h1>
      <MessageList
        messages={messages}
        onMarkSeen={handleMarkSeen} // 👈 importante pasarla
      />
    </div>
  );
}
