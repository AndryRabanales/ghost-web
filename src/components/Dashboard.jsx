"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageList from "@/components/MessageList";

const API = "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState(null);

  // Generar o recuperar creatorId único en localStorage
  useEffect(() => {
    let stored = localStorage.getItem("creatorId");
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem("creatorId", stored);
    }
    setCreatorId(stored);
  }, []);

  // Cargar mensajes sólo de este creatorId
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/messages?creatorId=${creatorId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (creatorId) fetchMessages();
  }, [creatorId]);

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

  if (loading || !creatorId) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <p>
        Tu link público:{" "}
        <a href={`/u/${creatorId}`}>
          {typeof window !== "undefined"
            ? `${window.location.origin}/u/${creatorId}`
            : `/u/${creatorId}`}
        </a>
      </p>

      <h1>Dashboard de mensajes</h1>
      <MessageList messages={messages} onStatusChange={handleStatusChange} />
    </div>
  );
}
