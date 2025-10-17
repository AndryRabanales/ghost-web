// src/components/ChatDetail.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import MessageForm from "@/components/MessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

/**
 * Componente para renderizar una sola burbuja de mensaje.
 */
const Message = ({ msg, creatorName, anonAlias }) => {
  const isCreator = msg.from === "creator";
  const senderName = isCreator ? creatorName : (msg.alias || anonAlias);

  return (
    <div className={`message-bubble-wrapper ${isCreator ? 'creator' : 'anon'}`}>
      <div> {/* Div interno para alineación */}
        <div className="message-alias">{senderName}</div>
        <div className={`message-bubble ${isCreator ? 'creator' : 'anon'}`}>
          {msg.content}
        </div>
        {/* --- La hora está quitada, como pediste --- */}
      </div>
    </div>
  );
};

/**
 * Componente principal que muestra la vista de un chat.
 */
export default function ChatDetail({ dashboardId, chatId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll automático al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Función local para obtener headers de autenticación
  const getHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // Cargar datos del chat y conectar WebSocket
  useEffect(() => {
    if (!dashboardId || !chatId) return;

    // 1. Cargar los mensajes existentes
    const fetchChatData = async (token) => {
      setLoading(true);
      setError(null);
      try {
        let res = await fetch(`${API}/dashboard/${dashboardId}/chats/${chatId}`, {
          headers: getHeaders(token),
        });

        if (res.status === 401) {
          const newToken = await refreshToken(localStorage.getItem("publicId"));
          if (newToken) {
            res = await fetch(`${API}/dashboard/${dashboardId}/chats/${chatId}`, {
              headers: getHeaders(newToken),
            });
          } else {
            throw new Error("Autenticación fallida");
          }
        }

        if (!res.ok) throw new Error("No se pudo cargar el chat");

        const data = await res.json();
        setMessages(data.messages || []);
        setChatInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // 2. Conectar al WebSocket
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Error de autenticación de WebSocket");
      return;
    }

    const wsUrl = `${API.replace(/^http/, "ws")}/ws?dashboardId=${dashboardId}&token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "message" && msg.chatId === chatId) {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      } catch (e) {
        console.error("Error procesando WS:", e);
      }
    };
    
    ws.onerror = (err) => console.error("Error WS (ChatDetail):", err);

    return () => {
      if (wsRef.current) wsRef.current.close();
    };

  }, [dashboardId, chatId]);

  if (loading) return <p style={{ textAlign: 'center', padding: '20px' }}>Cargando chat...</p>;
  if (error) return <p style={{ color: "red", textAlign: 'center', padding: '20px' }}>{error}</p>;

  const anonAlias = chatInfo?.anonAlias || "Anónimo";

  return (
    <div className="chat-detail-container">
      <div className="chat-header">
        <h3>Chat con {anonAlias}</h3>
        <button onClick={onBack} className="back-button">← Volver</button>
      </div>

      <div className="chat-messages-container">
        {messages.map((m) => (
          <Message
            key={m.id || Math.random()}
            msg={m}
            creatorName={"Tú"}
            anonAlias={anonAlias}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-footer">
        <MessageForm
          dashboardId={dashboardId}
          chatId={chatId}
          onMessageSent={() => {}}
          livesLeft={chatInfo?.livesLeft ?? 0}
          minutesToNextLife={chatInfo?.minutesToNextLife ?? 0}
        />
      </div>
    </div>
  );
}