"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const params = useParams();
  const dashboardId = params?.dashboardId || params?.id;

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    if (!dashboardId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando chats");
      setChats(data);
    } catch (err) {
      console.error("Error en fetchChats:", err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [dashboardId]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Chats del dashboard</h1>
      {loading && <p>Cargando…</p>}
      {!loading && chats.length === 0 && (
        <p style={{ color: "#666" }}>No hay chats aún.</p>
      )}
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
    </div>
  );
}
