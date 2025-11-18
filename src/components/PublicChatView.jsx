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

// --- Componente Principal PublicChatView ---
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
  const [linkCopied, setLinkCopied] = useState(false); // Estado para el botón de copiar
  const bottomRef = useRef(null);

  // --- Función para marcar como leído (usa props) ---
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

  // --- Scroll automático ---
  useEffect(() => {
    markChatAsRead(); 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, markChatAsRead]);

  // --- Función para copiar el enlace actual ---
  const copyPageUrl = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url)
        .then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        })
        .catch(err => console.error("Error al copiar:", err));
    }
  };

  // --- Manejo del envío de mensajes ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !onSendMessage) return;
    
    // Llama a la función del padre
    onSendMessage(newMsg); 
    
    // Limpia el input localmente
    setNewMsg(""); 
  };

  // --- Renderizado ---
  return (
    <div className="public-chat-view">
      {/* Header */}
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

      {/* 👇 BLOQUE DE SEGURIDAD: RECUPERACIÓN DE ENLACE 👇 */}
      <div style={{
          background: 'rgba(255, 193, 7, 0.1)', 
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#ffeeba', // Amarillo claro legible
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          animation: 'fadeInUp 0.5s ease forwards'
      }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ color: '#ffc107' }}>⚠ Importante:</strong>
            <span style={{ opacity: 0.9 }}>
              Guarda este enlace. Si cierras esta pestaña sin tener cuenta, podrías perder el chat.
            </span>
          </div>
          
          <button 
            onClick={copyPageUrl}
            style={{
                background: linkCopied ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 193, 7, 0.15)',
                border: `1px solid ${linkCopied ? '#28a745' : 'rgba(255, 193, 7, 0.5)'}`,
                color: linkCopied ? '#75b798' : '#ffc107',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                minWidth: '90px',
                textAlign: 'center'
            }}
          >
            {linkCopied ? "¡Copiado!" : "Copiar Link"}
          </button>
      </div>
      {/* 👆 FIN DEL BLOQUE 👆 */}

      {/* Cuerpo del Chat */}
      <div className="messages-display">
        {isLoading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando mensajes...</p>}
        {error && <p style={{ color: '#ff7b7b', textAlign: 'center' }}>{error}</p>}
        
        {messages.map((m) => (
          <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
        ))}
        
        <div ref={bottomRef} />
      </div>

      {/* Formulario de envío */}
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
}