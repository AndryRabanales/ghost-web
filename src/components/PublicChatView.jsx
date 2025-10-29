// src/components/PublicChatView.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente Message interno para esta vista ---
const Message = ({ msg, creatorName }) => {
  const isCreator = msg.from === "creator";
  const senderName = isCreator ? creatorName : "Tú"; // Anónimo siempre es "Tú" aquí

  return (
    // Alineación: Creador a la izquierda ('anon'), Anónimo a la derecha ('creator')
    <div className={`message-bubble-wrapper ${isCreator ? 'anon' : 'creator'}`}>
      <div>
        <div className="message-alias">{senderName}</div>
        {/* Estilo: Creador gris ('anon'), Anónimo púrpura ('creator') */}
        <div className={`message-bubble ${isCreator ? 'anon' : 'creator'}`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal PublicChatView ---
export default function PublicChatView({ chatInfo, onBack }) {
  const { anonToken, chatId, creatorName: initialCreatorName } = chatInfo;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [creatorName, setCreatorName] = useState(initialCreatorName || "Respuesta");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // Función para marcar el chat como leído en localStorage
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

  // Scroll y marcar como leído
  useEffect(() => {
    markChatAsRead(); // Marcar como leído al entrar
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, markChatAsRead]);

  // Cargar mensajes iniciales y conectar WebSocket
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar errores previos
        const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
        if (!res.ok) throw new Error("No se pudo cargar el chat");
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.creatorName) setCreatorName(data.creatorName);
      } catch (err) { setError("⚠️ Error cargando mensajes"); }
      finally { setLoading(false); }
    };
    fetchMessages();

    // --- Conexión WebSocket ---
    if (wsRef.current) { // Cerrar conexión previa si existe
      wsRef.current.onclose = null;
      wsRef.current.close(1000, "Componente re-montado");
    }

    const anonTokensString = anonToken; // El backend espera 'anonTokens'
    const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Asegurarse de que el mensaje es para ESTE chat específico
        if (msg.chatId === chatId) {
          setMessages((prev) => {
            // Evitar duplicados si el mensaje ya existe
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Marcar como leído si la ventana/tab está visible
          if (document.visibilityState === 'visible') markChatAsRead();
        }
      } catch (e) { console.error("Error procesando WebSocket (Chat View):", e); }
    };

    ws.onopen = () => console.log(`WebSocket (Chat View) conectado a chat ${chatId}`);
    ws.onerror = (error) => console.error("WebSocket (Chat View) error:", error);
    ws.onclose = (event) => {
      console.log(`WebSocket (Chat View) desconectado de chat ${chatId}. Code: ${event.code}.`);
      if (event.code === 1008) { // Código de cierre por política violada (token inválido?)
        setError("La sesión de chat expiró o fue rechazada.");
      }
      // Podrías intentar reconectar aquí si no es un cierre limpio (código 1000)
    };

    // Limpieza al desmontar
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Evitar que onclose se dispare después de desmontar
        wsRef.current.close(1000, "Componente desmontado limpiamente");
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, anonToken]); // Dependencias clave para recargar/reconectar si cambian

  // Enviar mensaje anónimo
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const tempMsgContent = newMsg;
    setNewMsg(""); // Limpiar input visualmente
    try {
      const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMsgContent }),
      });
      // No necesitamos añadir el mensaje aquí, esperamos que llegue por WebSocket
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error enviando el mensaje");
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError("⚠️ Error al enviar el mensaje. Inténtalo de nuevo.");
      setNewMsg(tempMsgContent); // Restaurar el texto si falla
    }
  };

  // Renderizado
  return (
    <div className="public-chat-view">
      <div className="chat-view-header">
        <h3>Chat con {creatorName}</h3>
        <button onClick={onBack} className="back-button">← Volver</button>
      </div>
      <div className="messages-display">
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando mensajes...</p>}
        {error && <p style={{ color: '#ff7b7b', textAlign: 'center' }}>{error}</p>}
        {messages.map((m) => (
          <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
        ))}
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