// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente de la Vista de Chat (integrado) ---
const PublicChatView = ({ chatInfo, onBack }) => {
    const { anonToken, chatId, creatorName: initialCreatorName } = chatInfo;
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [creatorName, setCreatorName] = useState(initialCreatorName || "Respuesta");
    const [anonAlias, setAnonAlias] = useState("Tú");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
                if (!res.ok) throw new Error("No se pudo cargar el chat");
                const data = await res.json();
                
                setMessages(data.messages || []);
                if (data.creatorName) setCreatorName(data.creatorName);
                const firstAnon = data.messages.find(m => m.from === "anon");
                if (firstAnon?.alias) setAnonAlias(firstAnon.alias);

            } catch (err) {
                setError("⚠️ Error cargando mensajes");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        const wsUrl = `${API.replace(/^http/, "ws")}/ws?chatId=${chatId}&anonToken=${anonToken}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.chatId === chatId) {
                    setMessages((prev) => {
                        // Previene duplicados si el mensaje ya existe
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                }
            } catch (e) { console.error("Error procesando WebSocket:", e); }
        };

        return () => ws.close();
    }, [chatId, anonToken]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim()) return;

        const tempMsgContent = newMsg;
        setNewMsg(""); // Limpia el input inmediatamente

        try {
            const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: tempMsgContent }),
            });

            if (!res.ok) {
              throw new Error("No se pudo enviar el mensaje");
            }
            // --- CORRECCIÓN CLAVE ---
            // Ya no actualizamos el estado aquí. El WebSocket se encargará de ello.
            // const actualMessage = await res.json();
            // setMessages((prev) => [...prev, actualMessage]);

        } catch (err) {
            setError("⚠️ No se pudo enviar el mensaje");
            setNewMsg(tempMsgContent); // Restaura el texto si falla el envío
        }
    };

    const Message = ({ msg, creatorName, anonAlias }) => {
        const isCreator = msg.from === "creator";
        const senderName = isCreator ? creatorName : (msg.alias || anonAlias);
    
        return (
            <div className={`message-container ${isCreator ? 'anon' : 'creator'}`}>
                <span className="message-sender">{senderName}</span>
                <div className="message-content-bubble">{msg.content}</div>
            </div>
        );
    };

    return (
        <div className="public-chat-view">
            <div className="chat-view-header">
                <h3>Chat con {creatorName}</h3>
                <button onClick={onBack} className="back-button">← Volver</button>
            </div>
            <div className="messages-display">
                {loading && <p>Cargando mensajes...</p>}
                {error && <p style={{ color: '#ff7b7b' }}>{error}</p>}
                {messages.map((m) => (
                    <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} anonAlias={anonAlias} />
                ))}
                <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="chat-reply-form">
                <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Escribe una respuesta..."
                    className="form-input-field reply-input"
                />
                <button type="submit" disabled={!newMsg.trim()} className="submit-button reply-button">
                    Enviar
                </button>
            </form>
        </div>
    );
};

// --- Componente Principal de la Página (sin cambios) ---
export default function PublicPage() {
  const params = useParams();
  const publicId = params.publicId;

  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const loadChats = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const relevantChats = stored.filter(chat => chat.creatorPublicId === publicId);
      relevantChats.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      setMyChats(relevantChats);
    } catch (error) {
      console.error("Error al cargar chats:", error);
    }
  };

  useEffect(() => {
    if (publicId) {
      loadChats();
    }
  }, [publicId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const pageStyles = `
    .page-container {
      background: linear-gradient(-45deg, #0d0c22, #1a1a2e, #2c1a5c, #3c287c);
      background-size: 400% 400%;
      animation: gradient-pan 15s ease infinite;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      font-family: var(--font-main);
    }
    @keyframes gradient-pan {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-container">
        <div style={{ maxWidth: 520, width: '100%' }}>
          {selectedChat ? (
            <PublicChatView chatInfo={selectedChat} onBack={() => setSelectedChat(null)} />
          ) : (
            <>
              <h1 style={{
                textAlign: 'center', marginBottom: '40px', fontSize: '36px',
                color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}>
                Envíame un Mensaje Anónimo y Genera un Nuevo chat
              </h1>
              <AnonMessageForm publicId={publicId} onSent={loadChats} />
              {myChats.length > 0 && (
                <div className="chats-list-section">
                  <h2 className="chats-list-title">Tus Chats Abiertos</h2>
                  <div className="chats-list-grid">
                    {myChats.map((chat) => (
                      <div
                        key={chat.chatId}
                        className="chat-list-item"
                        onClick={() => setSelectedChat(chat)}
                      >
                        <div className="chat-list-item-main">
                          <div className="chat-list-item-alias">{chat.anonAlias || "Anónimo"}</div>
                          <div className="chat-list-item-content">"{chat.preview}"</div>
                          <div className="chat-list-item-date">{formatDate(chat.ts)}</div>
                        </div>
                        <button className="chat-list-item-button">Abrir</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}