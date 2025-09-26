"use client";
import React, { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // cargar lista de chats con último mensaje
  const fetchChats = async () => {
    if (!dashboardId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats`);
      const data = await res.json();
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [dashboardId]);

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {chats.map((chat) => {
        const last = chat.messages?.[0];
        const seen = last?.seen || false; // asumimos que en ChatMessage hay campo seen

        return (
          <a
            key={chat.id}
            href={`/dashboard/${dashboardId}/chats/${chat.id}`}
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: seen ? "#e6ffe6" : "#ffe6e6", // verde si leído, rojo si sin leer
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Chat {seen ? <span style={{ color: "green" }}>Leído</span> : <span style={{ color: "red" }}>Sin leer</span>}
            </div>
            <div style={{ color: "#444" }}>
              {last ? last.content.slice(0, 80) : "Sin mensajes"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              {last ? new Date(last.createdAt).toLocaleString() : ""}
            </div>
          </a>
        );
      })}
    </div>
  );
}
