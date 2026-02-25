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
      <div className={`premium-message-wrapper ${isCreator ? 'received' : 'sent'}`}>
        <div className="premium-message-sender">{senderName}</div>
        <div className="premium-message-bubble">
          {msg.content}
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
    <div className="premium-chat-layout">
      <div className="premium-chat-container">

        <div className="premium-chat-header">
          <div>
            <h3>{creatorName}</h3>
            <div className="premium-chat-header-status">
              {creatorStatus.status === 'online' ? (
                <>
                  <div className="premium-status-dot"></div>
                  <span style={{ color: '#10b981' }}>En línea</span>
                </>
              ) : lastActiveDisplay ? (
                <span style={{ color: 'var(--chat-text-muted)' }}>Activo {lastActiveDisplay}</span>
              ) : (
                <span style={{ color: 'var(--chat-text-muted)' }}>...</span>
              )}
            </div>
          </div>
          <a href="/chats" style={{ color: 'var(--chat-text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Volver
          </a>
        </div>

        <div className="premium-chat-messages">
          {error && <p style={{ color: "#ef4444", textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>}
          {messages.length === 0 && !loading && (
            <div style={{ color: "var(--chat-text-muted)", textAlign: "center", padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span>Envía tu primer mensaje para iniciar el chat animado.</span>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="premium-chat-footer">
          <AnonChatReplyForm
            anonToken={anonToken}
            chatId={chatId}
            onMessageSent={(newMsg) => setMessages(prev => [...prev, newMsg])}
          />
        </div>

      </div>
    </div>
  );
}