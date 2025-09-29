"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function PublicChatPage() {
  const params = useParams();
  const anonToken = params.anonToken;
  const chatId = params.chatId;

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [creatorAlias, setCreatorAlias] = useState("Respuesta");

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);

        // cuando hay mensajes del creador, marca en localStorage que ya los viste
        const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
        const next = stored.map((c) =>
          c.chatId === chatId && c.anonToken === anonToken
            ? { ...c, hasReply: false }
            : c
        );
        localStorage.setItem("myChats", JSON.stringify(next));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatId, anonToken]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMsg }),
      });
      setNewMsg("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Mi Chat</h1>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 10,
          height: 400,
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>
              {m.from === "creator" ? `${creatorAlias}:` : "Tú:"}
            </strong>{" "}
            {m.content}
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ color: "#666", textAlign: "center" }}>
            No hay mensajes todavía.
          </div>
        )}
      </div>
      <form onSubmit={handleSend} style={{ marginTop: 10 }}>
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{ width: "100%", padding: 10 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>
          Enviar
        </button>
      </form>
    </div>
  );
}
