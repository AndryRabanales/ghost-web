"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function ChatPage() {
  const params = useParams();
  const dashboardId = params.dashboardId || params.id;
  const chatId = params.chatId;

  const [chat, setChat] = useState(null);
  const [newMsg, setNewMsg] = useState("");

  const fetchChat = async () => {
    try {
      const res = await fetch(`${API}/dashboard/chats/${chatId}`);
      const data = await res.json();
      setChat(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await fetch(`${API}/dashboard/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    });
    setNewMsg("");
    fetchChat();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Chat con {chat?.messages?.[0]?.alias || "Anónimo"}</h1>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 10,
          height: 400,
          overflowY: "auto",
        }}
      >
        {chat?.messages?.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.from === "creator" ? "Tú:" : (m.alias || "Anónimo") + ":"}</strong>{" "}
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ marginTop: 10 }}>
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe tu respuesta..."
          style={{ width: "100%", padding: 10 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>
          Enviar
        </button>
      </form>
    </div>
  );
}
