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

  const fetchMessages = async () => {
    if (!dashboardId) return;
    setLoading(true);
    try {
      console.log("Cargando mensajes para dashboardId:", dashboardId);
      const res = await fetch(`${API}/messages?dashboardId=${dashboardId}`);
      const data = await res.json();
      console.log("Respuesta de API:", res.status, data);
      if (!res.ok) {
        throw new Error(data.error || "Error cargando mensajes");
      }
      setMessages(data);
    } catch (err) {
      console.error("Error en fetchMessages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [dashboardId]);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      console.log("Respuesta al actualizar estado:", res.status, data);
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
