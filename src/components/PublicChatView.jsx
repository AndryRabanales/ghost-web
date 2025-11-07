// src/components/PublicChatView.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

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
  chatId, 
  anonToken,
  creatorStatus, 
  lastActiveDisplay,
  creatorName,
  
  // --- Props de estado recibidas del padre ---
  messages, 
  isLoading,
  error,
  onSendMessage // Función para enviar un mensaje
}) {
  
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);

  // --- ELIMINADOS:
  // - const [messages, setMessages]
  // - const [loading, setLoading]
  // - const [error, setError]
  // - const wsRef

  // --- MODIFICADO: markChatAsRead (ahora usa props) ---
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
  }, [chatId, anonToken]); // Depende de las props

  // --- MODIFICADO: useEffect de scroll (solo depende de messages) ---
  useEffect(() => {
    markChatAsRead(); 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, markChatAsRead]);

  // --- ELIMINADO: El 'useEffect' principal de fetchMessages y WebSocket ---
  // (Toda esa lógica ahora está en el padre: page.jsx)

  // --- MODIFICADO: handleSend ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !onSendMessage) return;
    
    // Llama a la función del padre
    onSendMessage(newMsg); 
    
    // Limpia el input localmente
    setNewMsg(""); 
  };

  // --- ELIMINADA: Lógica de isWaitingForReply (ahora en el padre) ---

  // Renderizado
  return (
    <div className="public-chat-view">
      {/* Header (sin cambios, usa props) */}
      <div className="chat-view-header">
        <div className="chat-header-info">
          <h3>Chat con {creatorName}</h3>
          <div className="chat-header-status">
            {creatorStatus === 'online' ? (
              <span className="status-online">En línea 🟢</span>
            ) : lastActiveDisplay ? (
              <span className="status-offline">Activo {lastActiveDisplay} ⚪</span>
            ) : (
              <span className="status-offline" style={{opacity: 0.6}}>...</span>
            )}
          </div>
        </div>
      </div>

      {/* Cuerpo del Chat (usa props 'isLoading', 'error', 'messages') */}
      <div className="messages-display">
        {isLoading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando mensajes...</p>}
        {error && <p style={{ color: '#ff7b7b', textAlign: 'center' }}>{error}</p>}
        
        {messages.map((m) => (
          <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
        ))}
        
        {/* Placeholder de "Esperando" eliminado de aquí */}
        
        <div ref={bottomRef} />
      </div>

      {/* Formulario de envío (usa handleSend modificado) */}
      <form onSubmit={handleSend} className="chat-reply-form">
        <input
          type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe una respuesta..." className="form-input-field reply-input"
        />
        <button type-="submit" disabled={!newMsg.trim()} className="submit-button reply-button">
          Enviar
        </button>
      </form>
    </div>
  );
}