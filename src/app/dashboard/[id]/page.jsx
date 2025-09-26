"use client";
import { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

const API = process.env.NEXT_PUBLIC_API;

export default function Dashboard({ params }) {
  const { id } = params; // dashboardId
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    const res = await fetch(`${API}/messages?dashboardId=${id}`);
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
  }, [id]);

  const handleStatusChange = async (msgId, status) => {
    await fetch(`${API}/messages/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchMessages();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard</h1>
      <MessageList messages={messages} onStatusChange={handleStatusChange} />
    </div>
  );
}
