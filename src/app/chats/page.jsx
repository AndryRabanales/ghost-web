"use client";
import { useEffect, useState } from "react";

export default function MyChatsPage() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('myChats') || '[]');
    setChats(stored.sort((a,b) => b.ts - a.ts));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Mis chats</h1>
      {chats.length === 0 ? (
        <p style={{ color: "#777" }}>No tienes chats aún. Envía un mensaje primero.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {chats.map((c) => (
            <a key={c.chatId} href={c.chatUrl} style={{
              display: "block",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fafafa",
              textDecoration: "none",
              color: "#111"
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Chat</div>
              <div style={{ color: "#444" }}>{c.preview || "Sin vista previa"}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                {new Date(c.ts).toLocaleString()}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
