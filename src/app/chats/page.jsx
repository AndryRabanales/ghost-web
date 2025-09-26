"use client";
import React, { useEffect, useState } from "react";

export default function MyChats() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // Recuperar chats guardados en localStorage por MessageForm
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    setChats(stored);
  }, []);

  if (chats.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
        <h1>Mis chats</h1>
        <p>No tienes chats abiertos aún.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Mis chats</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {chats.map((chat) => (
          <a
            key={chat.chatId}
            href={`/chats/${chat.anonToken}/${chat.chatId}`}
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
              {chat.preview || "Sin mensaje previo"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              {new Date(chat.ts).toLocaleString()}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
