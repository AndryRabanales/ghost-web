"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PublicChatPage() {
  const params = useParams();
  const { anonToken, chatId } = params;

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [creatorName, setCreatorName] = useState("Respuesta");
  const [anonAlias, setAnonAlias] = useState("Tú");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll automático al fondo
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Recuperar nombre y alias guardados
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const found = stored.find(
      (c) => c.chatId === chatId && c.anonToken === anonToken
    );
    if (found?.creatorName) setCreatorName(found.creatorName);
    if (found?.anonAlias) setAnonAlias(found.anonAlias);
  }, [chatId, anonToken]);

  const updateLocalStorage = (updater) => {
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const next = stored.map((c) =>
      c.chatId === chatId && c.anonToken === anonToken ? updater(c) : c
    );
    localStorage.setItem("myChats", JSON.stringify(next));
  };

  // 📥 Cargar mensajes iniciales (solo 1 vez)
  const fetchMessages = async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
      if (!res.ok) throw new Error("No se pudo cargar el chat");

      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);

        if (data.creatorName) {
          setCreatorName(data.creatorName);
          updateLocalStorage((c) => ({ ...c, creatorName: data.creatorName }));
        }

        const firstAnon = data.messages.find((m) => m.from === "anon");
        if (firstAnon?.alias) {
          setAnonAlias(firstAnon.alias);
          updateLocalStorage((c) => ({ ...c, anonAlias: firstAnon.alias }));
        }

        const creatorMsgs = data.messages.filter((m) => m.from === "creator");
        const lastCreatorId = creatorMsgs.length
          ? creatorMsgs[creatorMsgs.length - 1].id
          : null;

        updateLocalStorage((c) => ({
          ...c,
          hasReply: false,
          lastSeenCreatorId: lastCreatorId ?? c.lastSeenCreatorId ?? null,
        }));
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Error cargando mensajes");
    } finally {
      setLoading(false);
    }
  };

  // 🔌 WebSocket: escuchar mensajes nuevos
  useEffect(() => {
    fetchMessages(); // solo al inicio

    const apiBase = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
    const wsUrl = apiBase.replace(/^http(s?)/, "ws$1") + `/ws/chat?chatId=${chatId}`;
    
    const ws = new WebSocket(wsUrl);
    
    
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Conectado al WebSocket");
      // opcional: puedes autenticar con anonToken/chatId si lo implementas en backend
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Solo agregar si pertenece al chat actual
        if (msg.chatId === chatId) {
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        console.log("Mensaje WS no es JSON:", event.data);
      }
    };

    ws.onclose = () => console.log("❌ WS cerrado");

    return () => ws.close();
  }, [chatId, anonToken]);

  // ✉️ Enviar mensaje (REST normal)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMsg }),
      });
      if (!res.ok) throw new Error("No se pudo enviar el mensaje");
      setNewMsg("");
      // 👇 ya no hace falta fetchMessages(), el WS debe notificar
    } catch (err) {
      console.error(err);
      setError("⚠️ No se pudo enviar el mensaje");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando chat…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Chat con {creatorName}</h1>

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
        {messages.length === 0 && (
          <div style={{ color: "#666", textAlign: "center" }}>
            No hay mensajes todavía.
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: 8,
              textAlign: m.from === "creator" ? "left" : "right",
            }}
          >
            <strong>
              {m.from === "creator" ? `${creatorName}:` : `${m.alias}:`}
            </strong>{" "}
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSend} style={{ marginTop: 10 }}>
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{ width: "100%", padding: 10 }}
        />
        <button
          type="submit"
          style={{ marginTop: 8 }}
          disabled={!newMsg.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
