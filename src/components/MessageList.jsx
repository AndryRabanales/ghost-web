"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState(null);
  const router = useRouter();

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

  const markSeen = async (messageId) => {
    try {
      await fetch(`${API}/chat-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (chats.length === 0) return <p>No hay chats aún.</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {chats.map((chat) => {
        const last = chat.messages?.[0];
        const isOpen = openCard === chat.id;
        const seen = last?.seen || false;

        return (
          <div
            key={chat.id}
            onClick={(e) => {
              if (e.target.tagName !== "BUTTON") {
                if (!isOpen) {
                  setOpenCard(chat.id);
                  if (!seen && last?.id) markSeen(last.id);
                } else {
                  setOpenCard(null);
                }
              }
            }}
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: isOpen
                ? "#ffffff"
                : seen
                ? "#e6e6e6"
                : "#ffe6e6",
              textDecoration: "none",
              color: "#111",
              cursor: "pointer",
            }}
          >
            {isOpen ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Alias: {last?.alias || "Anónimo"}
                </div>
                <div style={{ color: "#444" }}>{last?.content}</div>
                <button
                  style={{
                    marginTop: 10,
                    padding: "6px 10px",
                    background: "#0070f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    router.push(`/dashboard/${dashboardId}/chats/${chat.id}`)
                  }
                >
                  Responder a {last?.alias || "Anónimo"}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {seen ? "Leído" : "Sin leer"}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {seen
                    ? "Mensaje oculto (Leído). Haz click para desplegar"
                    : "Mensaje bloqueado, haz click para ver"}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
