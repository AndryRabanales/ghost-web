"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API; // ya configurado

export default function DashboardPage() {
  const params = useParams();
  const { id } = params; // dashboardId
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/messages?dashboardId=${id}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMessages();
  }, [id]);

  const handleStatusChange = async (messageId, status) => {
    try {
      await fetch(`${API}/messages/${messageId}`, {
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
      <h1>Dashboard</h1>
      <MessageList messages={messages} onStatusChange={handleStatusChange} />
    </div>
  );
}
