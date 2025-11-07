// src/components/PublicChatView.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente Message interno (sin cambios) ---
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

// --- Componente Principal PublicChatView (MODIFICADO) ---
export default function PublicChatView({ 
  chatInfo, 
  // MODIFICADO: Nuevas props para estado
  creatorStatus, 
  lastActiveDisplay,
  creatorName 
}) {
  
  const { anonToken, chatId } = chatInfo;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  // ELIMINADO: creatorName ahora es una prop
  // const [creatorName, setCreatorName] = useState(initialCreatorName || "Respuesta");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // ... (markChatAsRead y useEffect de scroll sin cambios) ...
  const markChatAsRead = useCallback(() => {
    try {
      const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
      const updatedChats = storedChats.map(chat =>
        chat.chatId === chatId && chat.anonToken === anonToken
          ? { ...chat, hasNewReply: false }
          : chat
      );
      localStorage.setItem("myChats", JSON.stringify(updatedChats));
    } catch (e) { console.error("Error updating localStorage:", e); }
  }, [chatId, anonToken]);

  useEffect(() => {
    markChatAsRead(); 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, markChatAsRead]);


  // Cargar mensajes iniciales y conectar WebSocket
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
        if (!res.ok) throw new Error("No se pudo cargar el chat");
        const data = await res.json();
        setMessages(data.messages || []);
        // ELIMINADO: setCreatorName (ya viene por props)
        // if (data.creatorName) setCreatorName(data.creatorName);
      } catch (err) { setError("⚠️ Error cargando mensajes"); }
      finally { setLoading(false); }
    };
    fetchMessages();

    // --- Conexión WebSocket (sin cambios, es correcta) ---
    if (wsRef.current) { 
      wsRef.current.onclose = null;
      wsRef.current.close(1000, "Componente re-montado");
    }

    const anonTokensString = anonToken;
    const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.chatId === chatId) {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (document.visibilityState === 'visible') markChatAsRead();
        }
      } catch (e) { console.error("Error procesando WebSocket (Chat View):", e); }
    };

    ws.onopen = () => console.log(`WebSocket (Chat View) conectado a chat ${chatId}`);
    ws.onerror = (error) => console.error("WebSocket (Chat View) error:", error);
    ws.onclose = (event) => {
      console.log(`WebSocket (Chat View) desconectado de chat ${chatId}. Code: ${event.code}.`);
      if (event.code === 1008) { 
        setError("La sesión de chat expiró o fue rechazada.");
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; 
        wsRef.current.close(1000, "Componente desmontado limpiamente");
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, anonToken]);

  // ... (handleSend sin cambios) ...
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const tempMsgContent = newMsg;
    setNewMsg(""); 
    try {
      const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMsgContent }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error enviando el mensaje");
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError("⚠️ Error al enviar el mensaje. Inténtalo de nuevo.");
      setNewMsg(tempMsgContent);
    }
  };

  // --- INSTRUCCIÓN 1: Lógica para "Esperando respuesta" ---
  const lastMessage = messages[messages.length - 1];
  const isWaitingForReply = !loading && messages.length > 0 && (!lastMessage || lastMessage.from === 'anon');
  const showEmptyChatPlaceholder = !loading && messages.length === 0 && !error;


  // Renderizado
  return (
    <div className="public-chat-view">
      {/* --- MODIFICADO: Header del Chat --- */}
      <div className="chat-view-header">
        <div className="chat-header-info">
          <h3>Chat con {creatorName}</h3>
          {/* --- INSTRUCCIÓN 2: Estado En Línea --- */}
          <div className="chat-header-status">
            {creatorStatus === 'online' ? (
              <span className="status-online">En línea 🟢</span>
            ) : lastActiveDisplay ? (
              <span className="status-offline">Activo {lastActiveDisplay} ⚪</span>
            ) : (
              // Placeholder mientras carga
              <span className="status-offline" style={{opacity: 0.6}}>...</span>
            )}
          </div>
        </div>
        
        {/* ELIMINADO: Botón "Volver" */}
        {/* <button onClick={onBack} className="back-button">← Volver</button> */}
      </div>

      <div className="messages-display">
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando mensajes...</p>}
        {error && <p style={{ color: '#ff7b7b', textAlign: 'center' }}>{error}</p>}
        
        {messages.map((m) => (
          <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
        ))}

        {/* --- INSTRUCCIÓN 1: Placeholder de "Esperando" --- */}
        {showEmptyChatPlaceholder && (
          <div className="waiting-indicator">
            ¡Envía el primer mensaje para iniciar el chat!
          </div>
        )}
        {isWaitingForReply && (
          <div className="waiting-indicator">
            Espera a que {creatorName} te responda
            <span className="waiting-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        )}
        
        <div ref={bottomRef} /> {/* Referencia para scroll */}
      </div>
      <form onSubmit={handleSend} className="chat-reply-form">
        <input
          type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe una respuesta..." className="form-input-field reply-input"
        />
        <button type="submit" disabled={!newMsg.trim()} className="submit-button reply-button">
          Enviar
        </button>
      </form>
    </div>
  );
}