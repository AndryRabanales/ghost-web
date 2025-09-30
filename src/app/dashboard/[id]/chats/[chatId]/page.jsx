"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function ChatPage() {
  const params = useParams();
  const dashboardId = params.dashboardId || params.id;
  const chatId = params.chatId;

  const [chat, setChat] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [anonAlias, setAnonAlias] = useState("Anónimo");
  const [creatorName, setCreatorName] = useState("Tú");
  const [lastCount, setLastCount] = useState(0);
  const [toast, setToast] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchChat = async () => {
    try {
      const res = await fetch(`${API}/dashboard/chats/${chatId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        console.error("Error cargando chat:", res.status);
        return;
      }
      const data = await res.json();

      if (Array.isArray(data.messages)) {
        const firstAlias = data.messages.find(
          (m) => m.from === "anon" && m.alias
        )?.alias;
        if (firstAlias) setAnonAlias(firstAlias);
      }
      if (data.creatorName) setCreatorName(data.creatorName);
      setChat(data);
    } catch (err) {
      console.error("Error en fetchChat:", err);
    }
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    if (!chat?.messages) return;
    const unseenAnon = chat.messages.filter(
      (m) => m.from === "anon" && !m.seen
    );
    unseenAnon.forEach((m) => {
      fetch(`${API}/chat-messages/${m.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true }),
      }).catch(console.error);
    });
  }, [chat]);

  useEffect(() => {
    if (!chat?.messages) return;
    const count = chat.messages.length;
    if (count > lastCount) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg.from === "anon") {
        setToast(`Nuevo mensaje de ${lastMsg.alias || anonAlias}`);
        setTimeout(() => setToast(null), 4000);
      }
    }
    setLastCount(count);
  }, [chat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await fetch(`${API}/dashboard/chats/${chatId}/messages`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    });
    setNewMsg("");
    fetchChat();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, position: "relative" }}>
      <h1>Chat con {anonAlias}</h1>
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
            <strong>
              {m.from === "creator"
                ? `${creatorName}:`
                : `${m.alias || anonAlias}:`}
            </strong>{" "}
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ marginTop: 10 }}>
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe tu respuesta."
          style={{ width: "100%", padding: 10 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>
          Enviar
        </button>
      </form>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#333",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 6,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            zIndex: 9999,
            fontSize: 14,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
