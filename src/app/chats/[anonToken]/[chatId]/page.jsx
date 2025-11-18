// src/app/chats/[anonToken]/[chatId]/page.jsx
"use client";
// --- MODIFICADO: Añadido 'useCallback', quitado 'useRouter' si no se usa ---
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
// --- AÑADIDO: Importar la función timeAgo ---
import { timeAgo } from "@/utils/timeAgo"; 

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PublicChatPage() {
  const params = useParams();
  const { anonToken, chatId } = params;

  const [messages, setMessages] = useState([]);
  // --- ELIMINADO: 'newMsg' ya no es necesario ---
  // const [newMsg, setNewMsg] = useState("");
  const [creatorName, setCreatorName] = useState("Respuesta");
  const [anonAlias, setAnonAlias] = useState("Tú"); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- AÑADIDO: Estados para la presencia del creador ---
  const [creatorStatus, setCreatorStatus] = useState({ status: 'offline', lastActiveAt: null });
  const [lastActiveDisplay, setLastActiveDisplay] = useState(null);
  // --- FIN AÑADIDO ---

  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // --- Función para marcar como leído (sin cambios) ---
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

  // Scroll automático al fondo (sin cambios)
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
     markChatAsRead();
  }, [messages, markChatAsRead]);

  // Recuperar alias y nombre guardados (sin cambios)
   useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const found = stored.find(
      (c) => c.chatId === chatId && c.anonToken === anonToken
    );
    if (found?.creatorName) setCreatorName(found.creatorName);
    if (found?.anonAlias) setAnonAlias(found.anonAlias);
  }, [chatId, anonToken]);

  // Función para guardar actualizaciones en localStorage (sin cambios)
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
              
              // --- AÑADIDO: Guardar estado inicial del creador ---
              if (data.creatorLastActive) {
                const status = { status: 'offline', lastActiveAt: data.creatorLastActive };
                setCreatorStatus(status);
                setLastActiveDisplay(timeAgo(data.creatorLastActive));
              }
              // --- FIN AÑADIDO ---
              
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

    fetchMessages(); // Carga inicial

    // Conexión WebSocket (URL corregida)
    const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

     ws.onopen = () => console.log(`WebSocket conectado (Anónimo) escuchando token: ${anonToken}`);
     ws.onerror = (error) => console.error("WebSocket error:", error);
     ws.onclose = () => console.log(`WebSocket desconectado (Anónimo)`);

    ws.onmessage = (event) => {
      try {
            const msg = JSON.parse(event.data);
            
            // 1. Si llega un mensaje del creador
            if (msg.type === "message" && msg.from === "creator") { 
                setMessages((prev) => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                
                // --- AÑADIDO: Actualizar estado de "Nueva Respuesta" ---
                updateLocalStorage((c) => ({ ...c, hasNewReply: true }));
                
                if (document.visibilityState === 'visible') {
                    markChatAsRead();
                }
                // Si el creador envía un mensaje, está "en línea"
                setCreatorStatus({ status: 'online', lastActiveAt: new Date().toISOString() });
            }

            // --- AÑADIDO: Si llega una actualización de estado del creador ---
            if (msg.type === 'CREATOR_STATUS_UPDATE') {
              setCreatorStatus(prev => ({ ...prev, status: msg.status }));
              if (msg.status === 'offline') {
                const now = new Date().toISOString();
                setCreatorStatus(prev => ({ ...prev, lastActiveAt: now }));
                setLastActiveDisplay(timeAgo(now));
              }
            }
            // --- FIN AÑADIDO ---

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
  }, [chatId, anonToken, updateLocalStorage]); // Incluir updateLocalStorage

  // --- AÑADIDO: useEffect para actualizar el "hace X minutos" ---
  useEffect(() => {
    // Actualiza el 'timeAgo' cada minuto
    const interval = setInterval(() => {
      if (creatorStatus.status === 'offline' && creatorStatus.lastActiveAt) {
        setLastActiveDisplay(timeAgo(creatorStatus.lastActiveAt));
      }
    }, 60000); // 60 segundos
    return () => clearInterval(interval);
  }, [creatorStatus]);
  // --- FIN AÑADIDO ---


  // --- ELIMINADO: La función handleSend ya no es necesaria ---

   // Componente Message (adaptado para esta vista)
   const Message = ({ msg, creatorName }) => {
        const isCreator = msg.from === "creator";
        // --- MODIFICADO: Usamos el alias guardado ---
        const senderName = isCreator ? creatorName : (anonAlias || "Tú"); 

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

  if (loading) return <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando chat…</p>;

  // --- AÑADIDO: Lógica para saber si se está esperando respuesta ---
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  // Está esperando si el último mensaje es del anónimo, o si no hay mensajes
  const isWaitingForReply = !lastMessage || lastMessage.from === 'anon';
  // --- FIN AÑADIDO ---


  return (
    // Reutilizamos clases de la vista unificada si es posible
    <div className="public-chat-view" style={{ maxWidth: 600, margin: "40px auto", padding: 20, height: 'auto', maxHeight: 'none' }}>
      
      {/* --- MODIFICADO: Header ahora muestra el estado del creador --- */}
      <div className="chat-view-header">
           <div className="chat-header-info">
             <h3>Chat con {creatorName}</h3>
             <div className="chat-header-status">
              {creatorStatus.status === 'online' ? (
                <span className="status-online">En línea</span>
              ) : lastActiveDisplay ? (
                <span className="status-offline">Activo {lastActiveDisplay}</span>
              ) : (
                <span className="status-offline" style={{opacity: 0.6}}>...</span>
              )}
             </div>
           </div>
           <a href="/chats" className="back-button" style={{ textDecoration: 'none' }}>← Mis Chats</a>
      </div>
      {/* --- FIN MODIFICACIÓN --- */}


      <div className="messages-display">
        {error && <p style={{ color: "red", textAlign: 'center' }}>{error}</p>}
        {messages.length === 0 && !loading && (
              <div style={{ color: "#666", textAlign: "center", padding: '20px' }}>
                Aún no hay mensajes.
              </div>
        )}
         {messages.map((m) => (
             <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
         ))}
        <div ref={bottomRef} />
      </div>

      {/* --- MODIFICACIÓN: Formulario eliminado y reemplazado por indicador --- */}
      <div className="chat-footer" style={{paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
        {isWaitingForReply ? (
          // Reutiliza los estilos 'waiting-indicator' de globals.css
          <div className="waiting-indicator">
            <span>Esperando respuesta de {creatorName}</span>
            <div className="waiting-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        ) : (
          <div className="waiting-indicator" style={{animation: 'none', opacity: 0.7, color: 'var(--success-solid)'}}>
            <span>¡Respuesta recibida! El chat ha finalizado.</span>
          </div>
        )}
      </div>
      {/* --- FIN MODIFICACIÓN --- */}
      
    </div>
  );
}