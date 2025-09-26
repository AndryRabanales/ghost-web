"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API;

export default function DashboardPage() {
  const { id } = useParams(); // dashboardId
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

  // se llama tras marcar como leído o no leído
  const handleRefresh = () => {
    fetchMessages();
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Tu Dashboard</h1>
      <MessageList messages={messages} onStatusChange={handleRefresh} />
    </div>
  );
}
