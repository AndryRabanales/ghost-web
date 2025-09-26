"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function CreatorChatPage() {
  const { id, chatId } = useParams(); // id = creatorId
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  const fetchChat = async () => {
    try {
      const res = await fetch(`${API}/dashboard/chats/${chatId}`);
      const data = await res.json();
      setChat(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchChat();
      const int = setInterval(fetchChat, 6000);
      return () => clearInterval(int);
    }
  }, [chatId]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await fetch(`${API}/dashboard/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      setText("");
      fetchChat();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;
  if (!chat) return <p style={{ padding: 20 }}>Chat no encontrado.</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Chat con anónimo</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 300, maxHeight: 500, overflowY: "auto" }}>
        {chat.messages.map(m => (
          <div key={m.id} style={{
            display: "flex",
            justifyContent: m.from === "creator" ? "flex-end" : "flex-start",
            marginBottom: 8
          }}>
            <div style={{
              maxWidth: "80%",
              background: m.from === "creator" ? "#DCF8C6" : "#F1F0F0",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: "8px 10px"
            }}>
              <div style={{ fontSize: 12, color: "#777", marginBottom: 2 }}>
                {m.from === "creator" ? "Tú (creador)" : "Anónimo"}
              </div>
              <div>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe una respuesta…"
          style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button type="submit" style={{ padding: "10px 16px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          Responder
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        <a href={`/dashboard/${id}/chats`}>&larr; Volver a chats</a>
      </p>
    </div>
  );
}
