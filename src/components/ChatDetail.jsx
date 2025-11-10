// src/components/ChatDetail.jsx
"use client";
// --- MODIFICADO: Importar useState, useRef, useEffect ---
import { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import MessageForm from "@/components/MessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente Message (sin cambios) ---
const Message = ({ msg, creatorName, anonAlias }) => { /* ... (sin cambios) ... */
  const isCreator = msg.from === "creator";
  const senderName = isCreator ? creatorName : (msg.alias || anonAlias);

  return (
    <div className={`message-bubble-wrapper ${isCreator ? 'creator' : 'anon'}`}>
      <div>
        <div className="message-alias">{senderName}</div>
        <div className={`message-bubble ${isCreator ? 'creator' : 'anon'}`}>
          {msg.content}
        </div>
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
  
  // --- 👇 NUEVO ESTADO PARA EL ANÓNIMO 👇 ---
  const [isAnonOnline, setIsAnonOnline] = useState(false);
  // --- 👆 FIN NUEVO ESTADO 👆 ---

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll (sin cambios)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Headers (sin cambios)
  const getHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // --- useEffect (MODIFICADO para WebSocket) ---
  useEffect(() => {
    if (!dashboardId || !chatId) return;

    // 1. Cargar mensajes (sin cambios)
    const fetchChatData = async (token) => { /* ... (sin cambios) ... */
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
        setChatInfo(data); // chatInfo todavía contiene las 'vidas' de la API, pero ya no las usamos
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

    // --- 👇 MANEJADOR DE WEBSOCKET MODIFICADO 👇 ---
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // 1. Manejador de nuevo mensaje (sin cambios)
        if (msg.type === "message" && msg.chatId === chatId) {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }

        // 2. NUEVO: Manejador de estado (filtrando por este chatId)
        if (msg.type === "ANON_STATUS_UPDATE" && msg.chatId === chatId) {
          console.log("WS (ChatDetail) Status Update Recibido:", msg);
          setIsAnonOnline(msg.status === 'online');
        }
      } catch (e) {
        console.error("Error procesando WS:", e);
      }
    };
    // --- 👆 FIN DE MODIFICACIÓN 👆 ---
    
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
      {/* --- 👇 HEADER MODIFICADO 👇 --- */}
      <div className="chat-header">
        {/* Contenedor para alinear nombre y estado */}
        <div className="chat-header-info">
          <h3>Chat con {anonAlias}</h3>
          <div className="chat-header-status">
            {isAnonOnline ? (
              <span className="status-online">En línea 🟢</span>
            ) : (
              <span className="status-offline">Desconectado ⚪</span>
            )}
          </div>
        </div>
        <button onClick={onBack} className="back-button">← Volver</button>
      </div>
      {/* --- 👆 FIN DE HEADER 👆 --- */}


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
        {/* --- MODIFICADO: Props de 'vidas' eliminadas --- */}
        <MessageForm
          dashboardId={dashboardId}
          chatId={chatId}
          onMessageSent={() => {}}
        />
      </div>
    </div>
  );
}