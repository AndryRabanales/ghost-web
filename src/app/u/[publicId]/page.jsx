// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente PublicChatView (SIN CAMBIOS INTERNOS, solo se mueve aquí) ---
const PublicChatView = ({ chatInfo, onBack }) => {
    // ... (El código interno de PublicChatView que ya tenías va aquí sin cambios)
    const { anonToken, chatId, creatorName: initialCreatorName } = chatInfo;
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [creatorName, setCreatorName] = useState(initialCreatorName || "Respuesta");
    const [anonAlias, setAnonAlias] = useState("Tú"); // En la vista pública, el anónimo es "Tú"
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const wsRef = useRef(null); // Ref para el WebSocket

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
            // Opcional: Podrías llamar a una función prop para actualizar la lista en la página principal
        } catch (e) {
            console.error("Error updating localStorage:", e);
        }
    }, [chatId, anonToken]);

    useEffect(() => {
        // Marcar como leído al montar/abrir el chat
        markChatAsRead();

        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, markChatAsRead]); // Incluir markChatAsRead en dependencias

    useEffect(() => {
        const fetchMessages = async () => {
             // ... (lógica fetchMessages sin cambios) ...
             try {
                setLoading(true);
                const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
                if (!res.ok) throw new Error("No se pudo cargar el chat");
                const data = await res.json();

                setMessages(data.messages || []);
                if (data.creatorName) setCreatorName(data.creatorName);
                // Ajuste: En la vista pública, el alias del anónimo siempre es "Tú"
                // El alias guardado se usa en la lista, no aquí directamente.
                // const firstAnon = data.messages.find(m => m.from === "anon");
                // if (firstAnon?.alias) setAnonAlias(firstAnon.alias); // Ya no es necesario aquí

            } catch (err) {
                setError("⚠️ Error cargando mensajes");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // --- Conexión WebSocket ---
        const wsUrl = `${API.replace(/^http/, "ws")}/ws?chatId=${chatId}&anonToken=${anonToken}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws; // Guardar la instancia del WebSocket

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                 // Asegurarse de que el mensaje es para este chat
                 if (msg.chatId === chatId) {
                    setMessages((prev) => {
                         // Evitar duplicados si el mensaje ya existe
                         if (prev.some(m => m.id === msg.id)) return prev;
                         return [...prev, msg];
                    });
                     // Marcar como leído si la ventana está activa/visible (opcional pero bueno)
                    if (document.visibilityState === 'visible') {
                        markChatAsRead();
                    }
                }
            } catch (e) { console.error("Error procesando WebSocket:", e); }
        };

        ws.onopen = () => console.log(`WebSocket conectado a chat ${chatId}`);
        ws.onerror = (error) => console.error("WebSocket error:", error);
        ws.onclose = () => console.log(`WebSocket desconectado de chat ${chatId}`);


        // Limpieza al desmontar el componente
       return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, anonToken]); // Sacar markChatAsRead de aquí para evitar reconexiones

     const handleSend = async (e) => {
        // ... (lógica handleSend sin cambios) ...
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
              const errorData = await res.json();
              throw new Error(errorData.error || "No se pudo enviar el mensaje");
            }
             // Ya no añadimos manualmente, esperamos al WebSocket
             // const sentMsg = await res.json();
             // setMessages((prev) => [...prev, sentMsg]);

        } catch (err) {
            console.error("Error enviando mensaje:", err);
            setError("⚠️ No se pudo enviar el mensaje. Intenta de nuevo.");
            // Restaurar el contenido si falla el envío
            setNewMsg(tempMsgContent);
        }
    };


    // --- Componente Message (adaptado para vista pública) ---
    const Message = ({ msg, creatorName, anonAlias }) => {
        const isCreator = msg.from === "creator";
        // En la vista pública:
        // - Si es del creador, muestra su nombre.
        // - Si es del anónimo (from === 'anon'), muestra "Tú".
        const senderName = isCreator ? creatorName : "Tú";

        return (
             // Usamos 'creator' y 'anon' para la ALINEACIÓN y ESTILO
             // Si el mensaje es del creador (visto por el anónimo), se alinea a la IZQUIERDA (clase 'anon')
             // Si el mensaje es del anónimo (visto por el anónimo), se alinea a la DERECHA (clase 'creator')
            <div className={`message-bubble-wrapper ${isCreator ? 'anon' : 'creator'}`}>
              <div>
                  <div className="message-alias">{senderName}</div>
                  {/* El ESTILO de la burbuja sí depende de quién lo envió */}
                  <div className={`message-bubble ${isCreator ? 'anon' : 'creator'}`}>
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
                {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando mensajes...</p>}
                {error && <p style={{ color: '#ff7b7b', textAlign: 'center' }}>{error}</p>}
                {messages.map((m) => (
                    // Pasamos el alias guardado (que es "Tú" en este contexto)
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
                    className="form-input-field reply-input" // Reutiliza estilos si existen
                />
                <button type="submit" disabled={!newMsg.trim()} className="submit-button reply-button">
                    Enviar
                </button>
            </form>
        </div>
    );
};


export default function PublicPage() {
  // ... (estados: myChats, selectedChat, etc.)
  const wsRef = useRef(null);
  const loadChats = useCallback(() => { /* ... */ }, [publicId]);

  // --- MODIFICACIÓN EN useEffect del WebSocket ---
  useEffect(() => {
      if (!publicId) return;

      let relevantChats = loadChats(); // Carga inicial

      const connectWebSocket = () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.close();
          }
          if (relevantChats.length === 0) {
               console.log("No hay chats relevantes, no se conectará WebSocket.");
               return; // No conectar si no hay chats
          }

          // --- CAMBIO: Construir lista de anonTokens ---
          const anonTokensString = relevantChats.map(chat => chat.anonToken).join(',');
          if (!anonTokensString) {
              console.log("No se encontraron anonTokens válidos.");
              return; // No conectar si no hay tokens
          }

          // --- CAMBIO: Usar el nuevo parámetro 'anonTokens' ---
          const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => console.log(`WebSocket (Página Pública) conectado escuchando ${relevantChats.length} chats.`);
          ws.onerror = (error) => console.error("WebSocket (Página Pública) error:", error);
          ws.onclose = () => {
               console.log(`WebSocket (Página Pública) desconectado. Intentando reconectar...`);
               // Solo reconectar si todavía hay chats relevantes
               if (loadChats().length > 0) {
                  setTimeout(connectWebSocket, 5000); // Intenta reconectar
               } else {
                   console.log("No hay chats, conexión WebSocket cerrada permanentemente.");
               }
          };


          // La lógica de ws.onmessage (incluyendo notificación en título) NO necesita cambios aquí
           ws.onmessage = (event) => {
              try {
                  const msg = JSON.parse(event.data);
                  // Usar 'relevantChats' del closure o recargar si es necesario
                  const currentRelevantChats = loadChats(); // Recarga para asegurar que tenemos la lista más actual

                  if (msg.from === 'creator' && currentRelevantChats.some(c => c.chatId === msg.chatId)) {
                      const currentChats = JSON.parse(localStorage.getItem("myChats") || "[]");
                      let creatorName = 'Creador';
                      const updatedChats = currentChats.map(chat => {
                           if (chat.chatId === msg.chatId) {
                               creatorName = chat.creatorName || creatorName;
                               return { ...chat, hasNewReply: true, preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""), ts: msg.createdAt };
                           }
                           return chat;
                      });
                      localStorage.setItem("myChats", JSON.stringify(updatedChats));

                      // Actualiza el estado para la UI (loadChats ya lo hace)
                      // loadChats(); <-- ya se llama arriba

                      if (document.hidden) {
                          if (!window.originalTitle) window.originalTitle = document.title;
                          document.title = `(1) Nuevo mensaje de ${creatorName}`;
                      }
                  }
              } catch (e) { console.error("Error procesando WebSocket:", e); }
          };
      };

      connectWebSocket(); // Conexión inicial

      return () => { // Limpieza
          if (wsRef.current) {
              wsRef.current.onclose = null; // Evitar reconexión al desmontar
              wsRef.current.close();
          }
           if (window.originalTitle) {
              document.title = window.originalTitle;
               delete window.originalTitle;
           }
      };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, loadChats]); // Quitar 'relevantChats' de aquí, loadChats lo maneja

  // ... (resto del componente: useEffect visibilitychange, handleShowGuide, handleCloseGuide, handleOpenChat, formatDate, JSX)
  // Asegúrate de que handleOpenChat llame a loadChats() o actualice 'myChats' para quitar el "Nuevo" inmediatamente.
   const handleOpenChat = (chat) => {
      try {
          const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
          const updatedChats = storedChats.map(c =>
              c.chatId === chat.chatId && c.anonToken === chat.anonToken
                  ? { ...c, hasNewReply: false }
                  : c
          );
          localStorage.setItem("myChats", JSON.stringify(updatedChats));
          // Actualiza el estado directamente para respuesta visual inmediata
          setMyChats(prev => prev.map(c => c.chatId === chat.chatId ? {...c, hasNewReply: false} : c ));
          setSelectedChat(chat);
      } catch (e) {
          console.error("Error updating localStorage on open:", e);
          setSelectedChat(chat);
      }
  };


  const formatDate = (dateString) => {
    // ... (sin cambios)
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const pageStyles = `
    .page-container { /* ... (sin cambios) ... */ }
    @keyframes gradient-pan { /* ... (sin cambios) ... */ }
    @keyframes point-down {
      0%, 100% { transform: translateY(0); opacity: 1; }
      50% { transform: translateY(10px); opacity: 0.5; }
    }
    .scroll-cue {
      text-align: center;
      margin-top: 15px;
      color: var(--glow-accent-crimson);
      font-weight: bold;
      animation: point-down 1.5s ease-in-out infinite;
    }
     /* Indicador de Nuevo Mensaje */
    .new-reply-indicator {
      display: inline-block;
      margin-left: 8px;
      padding: 3px 8px;
      background-color: var(--primary-hellfire-red);
      color: white;
      font-size: 10px;
      font-weight: bold;
      border-radius: 10px;
      line-height: 1;
      vertical-align: middle;
      animation: pulse-indicator 1.5s infinite;
    }
    @keyframes pulse-indicator {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-container">
        {/* ... (Botón para ir al dashboard/inicio sin cambios) ... */}
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
            // Pasamos la función para recargar la lista al volver
            <PublicChatView chatInfo={selectedChat} onBack={() => {setSelectedChat(null); loadChats();}} />
          ) : (
            <>
              {/* ... (h1 sin cambios) ... */}
              <h1 style={{
                textAlign: 'center', marginBottom: '10px', fontSize: '26px',
                color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}>
                Envíame un Mensaje Anónimo y Abre un Chat Anónimo
              </h1>
              {/* Pasamos onFirstSent al formulario */}
              <AnonMessageForm publicId={publicId} onSent={loadChats} onFirstSent={handleFirstSend} />

              {/* Indicador visual para scroll */}
              {showScrollCue && (
                <div className="scroll-cue">
                  ↓ Tus chats aparecerán aquí abajo ↓
                </div>
              )}

              {/* ... (Enlace "Crear tu propio espacio" sin cambios) ... */}
               <div className="create-space-link-container staggered-fade-in-up" style={{ animationDelay: '0.8s' }}>
                 <a href="/" className="create-space-link">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Crear tu propio espacio
                 </a>
               </div>

              {/* Lista de Chats */}
              <div ref={chatsListRef} className={`chats-list-section ${myChats.length > 0 ? '' : 'staggered-fade-in-up'}`} style={{ animationDelay: myChats.length > 0 ? '0s' : '0.8s' }}>
                 {/* Solo muestra el título si hay chats */}
                 {myChats.length > 0 && (
                     <h2 className="chats-list-title">Tus Chats Abiertos</h2>
                 )}
                <div className="chats-list-grid">
                  {myChats.map((chat, index) => (
                    // Añadimos animación escalonada a cada item
                    <div
                      key={chat.chatId}
                      className="chat-list-item staggered-fade-in-up"
                      style={{ animationDelay: `${0.1 * index}s` }} // Delay incremental
                      onClick={() => handleOpenChat(chat)} // Usar la nueva función
                    >
                      <div className="chat-list-item-main">
                        <div className="chat-list-item-alias">
                          {chat.anonAlias || "Anónimo"}
                           {/* Indicador de Nuevo Mensaje */}
                           {chat.hasNewReply && <span className="new-reply-indicator">Nuevo</span>}
                        </div>
                        <div className="chat-list-item-content">"{chat.preview}"</div>
                        <div className="chat-list-item-date">{formatDate(chat.ts)}</div>
                      </div>
                      <button className="chat-list-item-button">Abrir</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}