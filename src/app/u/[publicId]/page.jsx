// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import React, { useEffect, useState, useRef } from "react";
// 👇 Importa useRouter
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente de la Vista de Chat (integrado - sin cambios internos) ---
const PublicChatView = ({ chatInfo, onBack }) => {
    // ... (contenido existente del componente PublicChatView sin cambios)
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
        setNewMsg("");

        try {
            const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: tempMsgContent }),
            });

            if (!res.ok) {
              throw new Error("No se pudo enviar el mensaje");
            }
            // WebSocket se encargará de actualizar los mensajes
        } catch (err) {
            setError("⚠️ No se pudo enviar el mensaje");
            setNewMsg(tempMsgContent);
        }
    };

    const Message = ({ msg, creatorName, anonAlias }) => {
      const isCreator = msg.from === "creator";
      const senderName = isCreator ? creatorName : "Tú";

      return (
          <div className={`message-bubble-wrapper ${msg.from === 'anon' ? 'creator' : 'anon'}`}>
            <div>
                <div className="message-alias">{senderName}</div>
                <div className={`message-bubble ${msg.from === 'anon' ? 'creator' : 'anon'}`}>
                    {msg.content}
                </div>
            </div>
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


// --- Componente Principal de la Página ---
export default function PublicPage() {
  const params = useParams();
  const publicId = params.publicId;
  // 👇 Inicializa useRouter
  const router = useRouter();

  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  // ... (loadChats, useEffect, formatDate sin cambios)
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
      position: relative; /* Añadido para posicionar el botón */
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
        {/* 👇 Botón para ir al dashboard/inicio */}
        <button
            onClick={() => router.push('/')}
            className="to-dashboard-button"
            title="Ir a mi espacio"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>

        <div style={{ maxWidth: 520, width: '100%' }}>
          {selectedChat ? (
            <PublicChatView chatInfo={selectedChat} onBack={() => setSelectedChat(null)} />
          ) : (
            <>
              <h1 style={{
                textAlign: 'center', marginBottom: '10px', fontSize: '26px',
                color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}>
                Envíame un Mensaje Anónimo y Abre un Chat Anónimo
              </h1>
              <AnonMessageForm publicId={publicId} onSent={loadChats} />
              <div className="create-space-link-container staggered-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <a href="/" className="create-space-link">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Crear tu propio espacio
                </a>
              </div>
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