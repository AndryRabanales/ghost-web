// src/app/chats/[anonToken]/[chatId]/page.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PublicChatPage() {
  const params = useParams();
  const { anonToken, chatId } = params;

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [creatorName, setCreatorName] = useState("Respuesta");
  const [anonAlias, setAnonAlias] = useState("Tú"); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // --- NUEVO: Función para determinar el remitente del último mensaje ---
  const getLastMessageSender = useCallback(() => {
    if (messages.length === 0) return 'none';
    return messages[messages.length - 1].from;
  }, [messages]);

  // --- Función para marcar como leído ---
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

  // Scroll automático al fondo
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
     markChatAsRead();
  }, [messages, markChatAsRead]);

  // ... (Recuperar alias y nombre guardados - sin cambios) ...
   useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const found = stored.find(
      (c) => c.chatId === chatId && c.anonToken === anonToken
    );
    if (found?.creatorName) setCreatorName(found.creatorName);
  }, [chatId, anonToken]);

  // Función para guardar actualizaciones en localStorage (si es necesario)
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


  // Cargar mensajes iniciales y conectar WebSocket
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

    // Conectar WebSocket
    // --- CORRECCIÓN WS: Usar 'anonTokens' (plural) ---
    const anonTokensString = anonToken;
    const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

     ws.onopen = () => console.log(`WebSocket conectado a chat ${chatId}`);
     ws.onerror = (error) => console.error("WebSocket error:", error);
     ws.onclose = () => console.log(`WebSocket desconectado de chat ${chatId}`);

    ws.onmessage = (event) => {
      try {
            const msg = JSON.parse(event.data);
            if (msg.chatId === chatId) { 
                setMessages((prev) => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                if (document.visibilityState === 'visible') {
                    markChatAsRead();
                }
            }
        } catch (e) {
            console.error("Error procesando WebSocket:", e);
        }
    };

    // Limpieza
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, anonToken, updateLocalStorage]); 

  // Enviar mensaje
  const handleSend = async (e) => {
    e.preventDefault();
        if (!newMsg.trim()) return;
        const tempMsg = newMsg;
        setNewMsg(""); 

        // OPTIMIZACIÓN Y AGONÍA: Agregar mensaje inmediatamente para pasar a estado de espera
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            from: 'anon',
            content: tempMsg,
            createdAt: new Date().toISOString(),
        }]);

        try {
          const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: tempMsg }),
          });
          if (!res.ok) {
              const errorData = await res.json();
              // Eliminar mensaje temporal si falla la API
              setMessages(prev => prev.filter(m => m.id !== tempId)); 
              throw new Error(errorData.error || "No se pudo enviar el mensaje");
          }
        } catch (err) {
          console.error(err);
          setError("⚠️ No se pudo enviar el mensaje. Intenta de nuevo.");
          setNewMsg(tempMsg); // Restaurar si falla
        }
  };

   // Componente Message (adaptado para esta vista)
   const Message = ({ msg, creatorName }) => {
        const isCreator = msg.from === "creator";
        const senderName = isCreator ? creatorName : "Tú"; 

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

  if (loading) return <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando chat…</p>;

  // CLAVE: Determinar si el último mensaje fue del anónimo
  const waitingForCreatorReply = getLastMessageSender() === 'anon';

  return (
    <div className="public-chat-view" style={{ maxWidth: 600, margin: "40px auto", padding: 20, height: 'auto', maxHeight: 'none' }}>
      <div className="chat-view-header">
           <h1>Chat con {creatorName}</h1>
      </div>

      <div className="messages-display">
        {error && <p style={{ color: "red", textAlign: 'center' }}>{error}</p>}
        {messages.length === 0 && !loading && (
              <div style={{ color: "#666", textAlign: "center", padding: '20px' }}>
                Aún no hay mensajes. ¡Envía el primero!
              </div>
        )}
         {messages.map((m) => (
             <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
         ))}
        <div ref={bottomRef} />
      </div>

      {/* --- Renderizado Condicional de Agonía/Obsesión --- */}
      {waitingForCreatorReply ? (
          <div className="waiting-for-reply-container">
             <p>⏳ El Creador aún no ha respondido. ¡Vuelve pronto y no te olvides de revisar!</p>
             <div className="pulse-dots"><span></span><span></span><span></span></div>
          </div>
      ) : (
          <form onSubmit={handleSend} className="chat-reply-form">
              <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="form-input-field reply-input"
                />
              <button
                  type="submit"
                  className="submit-button reply-button"
                  disabled={!newMsg.trim()}
              >
                  Enviar
              </button>
          </form>
      )}
    </div>
  );
}