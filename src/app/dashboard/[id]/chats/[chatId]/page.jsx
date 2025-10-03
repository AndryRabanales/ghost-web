"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { refreshToken } from "@/utils/auth";
import MessageForm from "@/components/MessageForm";

// ===========================
// API base
// ===========================
const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// ===========================
// Componente principal
// ===========================
export default function ChatPage() {
  const params = useParams();
  const dashboardId = params.id;
  const chatId = params.chatId;

  // ===========================
  // Estados principales
  // ===========================
  const [chat, setChat] = useState(null);
  const [anonAlias, setAnonAlias] = useState("Anónimo");
  const [creatorName, setCreatorName] = useState("Tú");
  const [lastCount, setLastCount] = useState(0);
  const [toast, setToast] = useState(null);

  // ❤️ Vidas
  const [livesLeft, setLivesLeft] = useState(null);
  const [minutesNext, setMinutesNext] = useState(null);

  // 🔌 WebSocket
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [wsStatus, setWsStatus] = useState("⏳ Conectando...");

  // LocalStorage
  const storageKey = `chat_${dashboardId}_${chatId}`;

  // Auto-scroll
  const messagesEndRef = useRef(null);

  // ===========================
  // Helpers
  // ===========================
  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  const formatAlias = (alias) => alias || "Anónimo";

  // ===========================
  // Fetch Chat
  // ===========================
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

      if (Array.isArray(data.messages)) {
        const firstAnon = data.messages.find((m) => m.from === "anon");
        if (firstAnon?.alias) setAnonAlias(firstAnon.alias);
      }

      if (data.creatorName) setCreatorName(data.creatorName);

      setChat((prev) => {
        const prevMsgs = prev?.messages || [];
        const newMsgs = data.messages || [];
        const merged = [...prevMsgs];
        newMsgs.forEach((m) => {
          if (!merged.find((x) => x.id === m.id)) merged.push(m);
        });
        localStorage.setItem(storageKey, JSON.stringify(merged));
        return { ...data, messages: merged };
      });

      if (data.livesLeft !== undefined) setLivesLeft(data.livesLeft);
      if (data.minutesToNextLife !== undefined) setMinutesNext(data.minutesToNextLife);
    } catch (err) {
      console.error("Error en fetchChat:", err);
    }
  };

  // ===========================
  // Fetch Perfil
  // ===========================
  const fetchProfile = async () => {
    try {
      let res = await fetch(`${API}/creators/me`, { headers: getAuthHeaders() });

      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(`${API}/creators/me`, { headers: getAuthHeaders(newToken) });
          }
        }
      }

      if (!res.ok) throw new Error("Error al obtener perfil");
      const data = await res.json();
      if (data.name) setCreatorName(data.name);
      if (data.lives !== undefined) setLivesLeft(data.lives);
      if (data.minutesToNextLife !== undefined) setMinutesNext(data.minutesToNextLife);
    } catch (err) {
      console.error("Error en fetchProfile:", err);
    }
  };

  // ===========================
  // Efectos
  // ===========================
  // 1) Cargar mensajes guardados
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setChat((prev) => ({ ...prev, messages: JSON.parse(saved) }));
    }
  }, [storageKey]);

  // 2) Polling inicial + perfil
  useEffect(() => {
    fetchProfile();
    fetchChat();
    const interval = setInterval(fetchChat, 60000);
    return () => clearInterval(interval);
  }, [chatId, dashboardId]);

  // 3) WebSocket con reconexión
  useEffect(() => {
    let retries = 0;
    const connectWS = () => {
      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_API?.replace(/^http/, "ws")}/ws/chat?chatId=${chatId}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WS conectado en ChatPage");
        setWsStatus("🟢 Conectado");
        retries = 0; // reset backoff
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.chatId === chatId) {
            setChat((prev) => {
              const prevMsgs = prev?.messages || [];
              if (prevMsgs.find((x) => x.id === msg.id && msg.id)) return prev;
              const updated = [...prevMsgs, msg];
              localStorage.setItem(storageKey, JSON.stringify(updated));
              return { ...prev, messages: updated };
            });

            if (msg.from === "anon") {
              setToast(`Nuevo mensaje de ${msg.alias || anonAlias}`);
              setTimeout(() => setToast(null), 5000);
            }
          }
        } catch {
          console.log("Mensaje WS no es JSON:", event.data);
        }
      };

      ws.onclose = () => {
        console.log("❌ WS desconectado");
        setWsStatus("🔴 Desconectado. Reintentando...");
        retries++;
        const delay = Math.min(10000, retries * 2000); // backoff hasta 10s
        reconnectRef.current = setTimeout(connectWS, delay);
      };

      ws.onerror = () => {
        setWsStatus("⚠️ Error de conexión");
      };
    };

    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [chatId, anonAlias, storageKey]);

  // 4) Toast cuando llega un nuevo mensaje
  useEffect(() => {
    if (!chat?.messages) return;
    const count = chat.messages.length;
    if (count > lastCount) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg.from === "anon") {
        setToast(`Nuevo mensaje de ${lastMsg.alias || anonAlias}`);
        setTimeout(() => setToast(null), 5000);
      }
    }
    setLastCount(count);
  }, [chat]);

  // 5) Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // ===========================
  // Render
  // ===========================
  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <h1>Chat con {anonAlias}</h1>

      {/* estado de conexión */}
      <div style={{ marginBottom: 8, fontSize: 14, color: "#666" }}>
        Estado WS: {wsStatus}
      </div>

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
          height: 420,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {chat?.messages?.map((m) => (
          <div
            key={m.id || Math.random()}
            style={{
              marginBottom: 10,
              padding: "6px 10px",
              borderRadius: 6,
              background: m.from === "creator" ? "#e1f5fe" : "#f1f1f1",
              textAlign: m.from === "creator" ? "right" : "left",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: "bold" }}>
              {m.from === "creator" ? creatorName : formatAlias(m.alias)}
            </div>
            <div>{m.content}</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {formatDate(m.createdAt)} {formatTime(m.createdAt)}
            </div>
          </div>
        ))}
        {!chat?.messages?.length && (
          <p style={{ color: "#666", textAlign: "center" }}>
            No hay mensajes todavía
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* enviar */}
      <MessageForm
        dashboardId={dashboardId}
        chatId={chatId}
        livesLeft={livesLeft}
        minutesToNextLife={minutesNext}
        onMessageSent={(newMsg) => {
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
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Panel debug (solo dev) */}
      {process.env.NODE_ENV === "development" && (
        <pre
          style={{
            marginTop: 20,
            fontSize: 12,
            padding: 10,
            background: "#111",
            color: "#0f0",
            borderRadius: 8,
            maxHeight: 150,
            overflow: "auto",
          }}
        >
          {JSON.stringify({ dashboardId, chatId, wsStatus, livesLeft, minutesNext }, null, 2)}
        </pre>
      )}
    </div>
  );
}
