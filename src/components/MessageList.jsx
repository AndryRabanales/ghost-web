"use client";
import React, { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dashboardId) return;
    setLoading(true);
    fetch(`${API}/dashboard/${dashboardId}/chats`)
      .then((res) => res.json())
      .then((data) => {
        setChats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setChats([]);
        setLoading(false);
      });
  }, [dashboardId]);

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {chats.map((chat) => {
        const last = chat.messages?.[0];
        return (
          <a
            key={chat.id}
            href={`/dashboard/${dashboardId}/chats/${chat.id}`}
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fafafa",
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Chat</div>
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
