"use client";
import React, { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

const API = "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/messages`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      fetchMessages();
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard de mensajes</h1>
      <MessageList messages={messages} onStatusChange={handleStatusChange} />
    </div>
  );
}
