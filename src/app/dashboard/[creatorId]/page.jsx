"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

const API = "https://ghost-api-2qmr.onrender.com";

export default function DashboardPage() {
  const { dashboardId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (dashboardId) fetchMessages();
  }, [dashboardId]);

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Tu Dashboard</h1>
      <p>Este es tu panel privado, solo tú debes tener este link.</p>
      <MessageList messages={messages} onStatusChange={handleStatusChange} />
    </div>
  );
}
