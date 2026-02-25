// src/app/chats/[anonToken]/[chatId]/page.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { timeAgo } from "@/utils/timeAgo";
import AnonChatReplyForm from "@/components/AnonChatReplyForm";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

export default function PublicChatPage() {
  const params = useParams();
  const { anonToken, chatId } = params;

  const [messages, setMessages] = useState([]);
  const [creatorName, setCreatorName] = useState("Respuesta");
  const [anonAlias, setAnonAlias] = useState("Tú");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [linkCopied, setLinkCopied] = useState(false);

  const [creatorStatus, setCreatorStatus] = useState({ status: 'offline', lastActiveAt: null });
  const [lastActiveDisplay, setLastActiveDisplay] = useState(null);

  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  const markChatAsRead = useCallback(() => {
    try {
      const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
      const updatedChats = storedChats.map(chat =>
        chat.chatId === chatId && chat.anonToken === anonToken
          ? { ...chat, hasNewReply: false }
          : chat
      );
      localStorage.setItem("myChats", JSON.stringify(updatedChats));
    } catch (e) {
      console.error("Error updating localStorage:", e);
    }
  }, [chatId, anonToken]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    markChatAsRead();
  }, [messages, markChatAsRead]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const found = stored.find(
      (c) => c.chatId === chatId && c.anonToken === anonToken
    );
    if (found?.creatorName) setCreatorName(found.creatorName);
    if (found?.anonAlias) setAnonAlias(found.anonAlias);
  }, [chatId, anonToken]);

  const updateLocalStorage = useCallback((updater) => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const next = stored.map((c) =>
        c.chatId === chatId && c.anonToken === anonToken ? updater(c) : c
      );
      localStorage.setItem("myChats", JSON.stringify(next));
    } catch (e) {
      console.error("Error updating localStorage:", e);
    }
  }, [chatId, anonToken]);


  useEffect(() => {
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

          if (data.creatorLastActive) {
            const status = { status: 'offline', lastActiveAt: data.creatorLastActive };
            setCreatorStatus(status);
            setLastActiveDisplay(timeAgo(data.creatorLastActive));
          }

          markChatAsRead();

        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
        setError("⚠️ Error cargando mensajes");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log(`WebSocket conectado (Anónimo) escuchando token: ${anonToken}`);
    ws.onerror = (error) => console.error("WebSocket error:", error);
    ws.onclose = () => console.log(`WebSocket desconectado (Anónimo)`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "message") {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (msg.from === "creator") {
            updateLocalStorage((c) => ({ ...c, hasNewReply: true }));
            if (document.visibilityState === 'visible') {
              markChatAsRead();
            }
            setCreatorStatus({ status: 'online', lastActiveAt: new Date().toISOString() });
          }
        }

        if (msg.type === 'CREATOR_STATUS_UPDATE') {
          setCreatorStatus(prev => ({ ...prev, status: msg.status }));
          if (msg.status === 'offline') {
            const now = new Date().toISOString();
            setCreatorStatus(prev => ({ ...prev, lastActiveAt: now }));
            setLastActiveDisplay(timeAgo(now));
          }
        }

      } catch (e) {
        console.error("Error procesando WebSocket:", e);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatId, anonToken, updateLocalStorage, markChatAsRead]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (creatorStatus.status === 'offline' && creatorStatus.lastActiveAt) {
        setLastActiveDisplay(timeAgo(creatorStatus.lastActiveAt));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [creatorStatus]);

  const Message = ({ msg, creatorName }) => {
    const isCreator = msg.from === "creator";
    const senderName = isCreator ? creatorName : (anonAlias || "Tú");

    return (
      <div className={`message-bubble-wrapper ${isCreator ? 'anon' : 'creator'}`}>
        <div>
          <div className="message-alias">{senderName}</div>
          <div className={`message-bubble ${isCreator ? 'anon' : 'creator'}`}>
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  const copyPageUrl = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url)
        .then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        })
        .catch(err => console.error("Error al copiar:", err));
    }
  };

  if (loading) return <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando chat…</p>;

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isWaitingForReply = !lastMessage || lastMessage.from === 'anon';

  return (
    <div className="public-chat-view" style={{ maxWidth: 600, margin: "40px auto", padding: 20, height: 'auto', maxHeight: 'none' }}>

      <div className="chat-view-header">
        <div className="chat-header-info">
          <h3>Chat con {creatorName}</h3>
          <div className="chat-header-status">
            {creatorStatus.status === 'online' ? (
              <span className="status-online">En línea</span>
            ) : lastActiveDisplay ? (
              <span className="status-offline">Activo {lastActiveDisplay}</span>
            ) : (
              <span className="status-offline" style={{ opacity: 0.6 }}>...</span>
            )}
          </div>
        </div>
        <a href="/chats" className="back-button" style={{ textDecoration: 'none' }}>← Mis Chats</a>
      </div>

      {/* EL BLOQUE DE SEGURIDAD YA NO ESTÁ AQUÍ ARRIBA */}

      <div className="messages-display">
        {error && <p style={{ color: "red", textAlign: 'center' }}>{error}</p>}
        {messages.length === 0 && !loading && (
          <div style={{ color: "#666", textAlign: "center", padding: '20px' }}>
            Aún no hay mensajes.
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-footer" style={{ paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>

        <AnonChatReplyForm
          anonToken={anonToken}
          chatId={chatId}
          onMessageSent={(newMsg) => setMessages(prev => [...prev, newMsg])}
        />


        {/* --- 👇 AHORA EL BLOQUE ESTÁ AQUÍ ABAJO 👇 --- */}
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          marginTop: '20px', // Añadido margen superior para separar del "Esperando..."
          marginBottom: '10px',
          fontSize: '13px',
          color: '#ffeeba',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          animation: 'fadeInUp 0.5s ease forwards'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ color: '#ffc107' }}>⚠ Importante:</strong>
            <span style={{ opacity: 0.9 }}>
              Esta página fue enviada a tu email. Guarda este enlace, podrías perder el chat.
            </span>
          </div>

          <button
            onClick={copyPageUrl}
            style={{
              background: linkCopied ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 193, 7, 0.15)',
              border: `1px solid ${linkCopied ? '#28a745' : 'rgba(255, 193, 7, 0.5)'}`,
              color: linkCopied ? '#75b798' : '#ffc107',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              minWidth: '90px',
              textAlign: 'center'
            }}
          >
            {linkCopied ? "¡Copiado!" : "Copiar Link"}
          </button>
        </div>
        {/* --- 👆 FIN DEL BLOQUE DE SEGURIDAD 👆 --- */}
      </div>

    </div>
  );
}