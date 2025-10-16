"use client";
import React, { useEffect, useState, useRef } from "react";
import { refreshToken } from "../utils/auth";
import MessageForm from "./MessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Sub-componente de Burbuja de Mensaje (sin cambios) ---
const MessageBubble = ({ msg, creatorName, anonAlias }) => {
    const isCreator = msg.from === "creator";
    return (
      <div className={`message-container ${isCreator ? 'creator' : 'anon'}`}>
        <span className="message-sender">{isCreator ? creatorName : (msg.alias || anonAlias)}</span>
        {/* React sanitiza automáticamente este contenido, por lo que es seguro */}
        <div className="message-content-bubble">{msg.content}</div>
      </div>
    );
};

export default function ChatDetail({ dashboardId, chatId, onBack }) {
    const [messages, setMessages] = useState([]);
    const [creatorName, setCreatorName] = useState("Tú");
    const [anonAlias, setAnonAlias] = useState("Anónimo");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [livesLeft, setLivesLeft] = useState(null);
    const [minutesNext, setMinutesNext] = useState(null);
    const bottomRef = useRef(null);
    const wsRef = useRef(null);

    const getAuthHeaders = (token) => {
        const t = token || localStorage.getItem("token");
        return t ? { Authorization: `Bearer ${t}` } : {};
    };

    useEffect(() => {
        const fetchChatAndProfile = async (token) => {
            try {
                setLoading(true);
                const headers = getAuthHeaders(token);
                const [chatRes, profileRes] = await Promise.all([
                    fetch(`${API}/dashboard/${dashboardId}/chats/${chatId}`, { headers }),
                    fetch(`${API}/creators/me`, { headers })
                ]);

                if (chatRes.status === 401 || profileRes.status === 401) {
                    const newToken = await refreshToken(localStorage.getItem("publicId"));
                    if (newToken) await fetchChatAndProfile(newToken);
                    return;
                }

                if (chatRes.ok) {
                    const data = await chatRes.json();
                    setMessages(data.messages || []);
                    // El `creatorName` del creador siempre es él mismo ("Tú") en esta vista.
                    // El `anonAlias` sí viene del chat.
                    setAnonAlias(data.anonAlias || "Anónimo");
                } else { throw new Error("No se pudo cargar el chat"); }
                
                if(profileRes.ok) {
                    const data = await profileRes.json();
                    setLivesLeft(data.lives);
                    setMinutesNext(data.minutesToNextLife);
                }
            } catch (err) { setError("⚠️ Error cargando mensajes"); } 
            finally { setLoading(false); }
        };

        fetchChatAndProfile();

        // 👇 --- INICIO DE LA CORRECCIÓN DE SEGURIDAD DE WEBSOCKET --- 👇
        const token = localStorage.getItem("token"); // 1. Obtener el token JWT
        if (!token) {
          console.error("No hay token para la conexión WS, abortando.");
          setError("Error de autenticación, por favor re-inicia sesión.");
          return;
        }

        // 2. Añadir el token a la URL de conexión para autenticar el WebSocket en el backend
        const wsUrl = `${API.replace(/^http/, "ws")}/ws?dashboardId=${dashboardId}&token=${token}`; 
        // 👆 --- FIN DE LA CORRECCIÓN DE SEGURIDAD DE WEBSOCKET --- 👆

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            // El backend ahora podría enviar mensajes de tipo 'message'
            if (msg.type === 'message' && msg.chatId === chatId) {
                setMessages((prev) => {
                    if (prev.some(m => m.id === msg.id)) {
                        return prev;
                    }
                    return [...prev, msg];
                });
            }
        };
        return () => ws.close();
    }, [chatId, dashboardId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleMessageSent = (newMsg) => {
        setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) {
                return prev;
            }
            return [...prev, newMsg];
        });
      // Refrescar vidas después de enviar
      fetch(`${API}/creators/me`, { headers: getAuthHeaders() })
          .then(res => res.json())
          .then(data => {
              if (data) {
                setLivesLeft(data.lives);
                setMinutesNext(data.minutesToNextLife);
              }
          });
  };

    return (
        <div className="public-chat-view">
            <div className="chat-view-header">
                <h3>Chat con {anonAlias}</h3>
                <button onClick={onBack} className="back-button">← Volver</button>
            </div>
            <div className="messages-display">
                {loading && <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>Cargando...</p>}
                {error && <p style={{ color: '#ff7b7b', textAlign: 'center' }}>{error}</p>}
                {messages.map((m) => (
                    <MessageBubble key={m.id || Math.random()} msg={m} creatorName={creatorName} anonAlias={anonAlias} />
                ))}
                <div ref={bottomRef} />
            </div>
            <MessageForm
                dashboardId={dashboardId}
                chatId={chatId}
                livesLeft={livesLeft}
                minutesToNextLife={minutesNext}
                onMessageSent={handleMessageSent}
            />
        </div>
    );
}

