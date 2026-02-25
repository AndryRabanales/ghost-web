// src/components/ChatDetail.jsx
"use client";
// --- MODIFICADO: Importar useState, useRef, useEffect ---
import { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import MessageForm from "@/components/MessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

// --- Componente Message (sin cambios) ---
const Message = ({ msg, creatorName, anonAlias }) => {
  const isCreator = msg.from === "creator";
  const senderName = isCreator ? creatorName : (msg.alias || anonAlias);

  return (
    <div className={`premium-message-wrapper ${isCreator ? 'sent' : 'received'}`}>
      <div className="premium-message-sender">{senderName}</div>
      <div className="premium-message-bubble">
        {msg.content}
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

  // --- 👇 1. ELIMINADO EL ESTADO 'isAnonOnline' 👇 ---
  // const [isAnonOnline, setIsAnonOnline] = useState(false);

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

    // --- 👇 2. MANEJADOR DE WEBSOCKET MODIFICADO (SIN LÓGICA DE ESTADO) 👇 ---
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

        // 2. ELIMINADO: Manejador de estado 'ANON_STATUS_UPDATE'

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

  // --- 👇 3. AÑADIDO: OBTENER LA ÚLTIMA PREGUNTA DEL ANÓNIMO 👇 ---
  const lastAnonMessage = messages.filter(m => m.from === 'anon').pop();

  return (
    <div className="premium-chat-layout">
      <div className="premium-chat-container">

        <div className="premium-chat-header">
          <div>
            <h3>{anonAlias}</h3>
          </div>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--chat-text-muted)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        <div className="premium-chat-messages">
          {messages.length === 0 && !loading && (
            <div style={{ color: "var(--chat-text-muted)", textAlign: "center", padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span>Envía una respuesta para iniciar el chat animado.</span>
            </div>
          )}
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

        <div className="premium-chat-footer">
          <MessageForm
            dashboardId={dashboardId}
            chatId={chatId}
            onMessageSent={() => { }}
            lastAnonQuestion={lastAnonMessage?.content}
          />
        </div>

      </div>
    </div>
  );
}