"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API || "http://localhost:3001";

export default function Dashboard() {
  const params = useParams();
  const dashboardId = params?.dashboardId; // viene de /dashboard/[dashboardId]

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // traer mensajes de ese dashboard
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

  // cuando un mensaje se ve/cambia su estado, refrescamos lista
  const handleStatusChange = () => {
    fetchMessages();
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard de mensajes</h1>
      <MessageList messages={messages} onStatusChange={handleStatusChange} />
    </div>
  );
}
