"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { refreshToken } from "@/utils/auth";
import MessageForm from "@/components/MessageForm";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function ChatPage() {
  const params = useParams();
  const dashboardId = params.id;
  const chatId = params.chatId;

  const [chat, setChat] = useState(null);
  const [anonAlias, setAnonAlias] = useState("Anónimo");
  const [creatorName, setCreatorName] = useState("Tú");
  const [lastCount, setLastCount] = useState(0);
  const [toast, setToast] = useState(null);

  // vidas
  const [livesLeft, setLivesLeft] = useState(null);
  const [minutesNext, setMinutesNext] = useState(null);

  const storageKey = `chat_${dashboardId}_${chatId}`;

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchChat = async () => {
    try {
      let res = await fetch(
        `${API}/dashboard/${dashboardId}/chats/${chatId}`,
        { headers: getAuthHeaders() }
      );

      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(
              `${API}/dashboard/${dashboardId}/chats/${chatId}`,
              { headers: getAuthHeaders(newToken) }
            );
          }
        }
      }

      if (!res.ok) throw new Error("Error al obtener chat");

      const data = await res.json();

      // alias del anónimo (usa el primer msg anon si trae alias)
      if (Array.isArray(data.messages)) {
        const firstAnon = data.messages.find((m) => m.from === "anon");
        if (firstAnon?.alias) setAnonAlias(firstAnon.alias);
      }

      if (data.creatorName) setCreatorName(data.creatorName);

      // 🔹 fusionar mensajes anteriores con nuevos
      setChat((prev) => {
        const prevMsgs = prev?.messages || [];
        const newMsgs = data.messages || [];
        const merged = [...prevMsgs];

        newMsgs.forEach((m) => {
          if (!merged.find((x) => x.id === m.id)) merged.push(m);
        });

        // guardar en localStorage
        localStorage.setItem(storageKey, JSON.stringify(merged));

        return { ...data, messages: merged };
      });

      // vidas
      if (data.livesLeft !== undefined) setLivesLeft(data.livesLeft);
      if (data.minutesToNextLife !== undefined) setMinutesNext(data.minutesToNextLife);
    } catch (err) {
      console.error("Error en fetchChat:", err);
    }
  };

  // 🟢 Cargar mensajes guardados al inicio
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setChat((prev) => ({ ...prev, messages: JSON.parse(saved) }));
    }
  }, [storageKey]);

  // Polling
  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [chatId, dashboardId]);

  // Toast llegada de anon
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

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Chat con {anonAlias}</h1>

      {/* vidas */}
      {livesLeft !== null && (
        <div style={{ marginBottom: 12, color: "#444" }}>
          ❤️ Vidas restantes: {livesLeft} <br />
          ⏳ Próxima vida en: {minutesNext} min
        </div>
      )}

      {/* lista de mensajes */}
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
              {m.from === "creator" ? `${creatorName}:` : `${m.alias || anonAlias}:`}
            </strong>{" "}
            {m.content}
          </div>
        ))}
        {!chat?.messages?.length && (
          <p style={{ color: "#666", textAlign: "center" }}>
            No hay mensajes todavía
          </p>
        )}
      </div>

      {/* enviar */}
      <MessageForm
        dashboardId={dashboardId}
        chatId={chatId}
        livesLeft={livesLeft}
        minutesToNextLife={minutesNext}
        onMessageSent={(newMsg) => {
          // agrega el mensaje del creador inmediatamente
          setChat((prev) => {
            const updated = [...(prev?.messages || []), newMsg];
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return { ...prev, messages: updated };
          });
        }}
      />

      {/* toast */}
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
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
