// src/components/ChatDetail.jsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import MessageForm from "@/components/MessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

const MessageBubble = ({ message, creatorName, anonAlias }) => {
  const isCreator = message.from === "creator";
  const alignClass = isCreator ? "creator" : "anon";
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`message-bubble-wrapper ${alignClass}`}>
      <div className={`message-bubble ${alignClass}`}>
        <div className="message-alias">
          {isCreator ? creatorName : (message.alias || anonAlias)}
        </div>
        <div className="message-content">{message.content}</div>
        <div className="message-timestamp">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
};

export default function ChatDetail({ dashboardId, chatId }) {
  const [chat, setChat] = useState(null);
  const [anonAlias, setAnonAlias] = useState("Anónimo");
  const [creatorName, setCreatorName] = useState("Tú");
  const [livesLeft, setLivesLeft] = useState(null);
  const [minutesNext, setMinutesNext] = useState(null);
  const [toast, setToast] = useState(null);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [wsStatus, setWsStatus] = useState("⏳ Conectando...");
  
  const messagesEndRef = useRef(null);
  const storageKey = `chat_${dashboardId}_${chatId}`;

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchChat = async () => {
    try {
      let res = await fetch(`${API}/dashboard/${dashboardId}/chats/${chatId}`, { headers: getAuthHeaders() });
      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(`${API}/dashboard/${dashboardId}/chats/${chatId}`, { headers: getAuthHeaders(newToken) });
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

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setChat((prev) => ({ ...prev, messages: JSON.parse(saved) }));
    }
    fetchProfile();
    fetchChat();
    const interval = setInterval(fetchChat, 60000);
    return () => clearInterval(interval);
  }, [chatId, dashboardId, storageKey]);

  useEffect(() => {
    let retries = 0;
    const connectWS = () => {
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_API?.replace(/^http/, "ws")}/ws/chat?chatId=${chatId}`);
      wsRef.current = ws;
      ws.onopen = () => {
        setWsStatus("Online");
        retries = 0;
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
              setTimeout(() => setToast(null), 4000);
            }
          }
        } catch (e) {
          console.log("Mensaje WS no es JSON:", event.data);
        }
      };
      ws.onclose = () => {
        setWsStatus("Reconectando...");
        retries++;
        const delay = Math.min(10000, retries * 2000);
        reconnectRef.current = setTimeout(connectWS, delay);
      };
      ws.onerror = () => {
        setWsStatus("Error");
      };
    };
    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [chatId, anonAlias, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  if (!chat) return <div style={{textAlign: 'center', padding: 40, fontSize: '18px'}}>Selecciona un chat para comenzar</div>;

  return (
    <div className="chat-detail-container">
      <header className="chat-header">
        <h3>Chat con {anonAlias}</h3>
        <span className={`status-indicator ${wsStatus === 'Online' ? 'online' : ''}`}>{wsStatus}</span>
      </header>
      <div className="chat-messages-container">
        {chat.messages.map((m) => (
          <MessageBubble key={m.id || Math.random()} message={m} creatorName={creatorName} anonAlias={anonAlias} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <footer className="chat-footer">
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
      </footer>
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}