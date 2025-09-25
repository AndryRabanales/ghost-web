"use client";
import React, { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

const API = "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los mensajes
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/messages`);
      const data = await res.json();
      // Si tu API devuelve directamente un array:
      setMessages(data);
      // Si en tu API tienes visible/locked separados, podrías combinarlos aquí:
      // const unlocked = data.visible || [];
      // const locked = data.locked || [];
      // const combined = [
      //   ...unlocked.map((m) => ({ ...m, isLocked: false })),
      //   ...locked.map((m) => ({ ...m, isLocked: true })),
      // ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // setMessages(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
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
