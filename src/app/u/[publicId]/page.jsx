// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
// Asegúrate de que este archivo exista en src/components/ si quieres usar el modal
import FirstMessageGuideModal from "@/components/FirstMessageGuideModal";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente PublicChatView (Incluido aquí para completitud) ---
const PublicChatView = ({ chatInfo, onBack }) => {
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
        } catch (e) { console.error("Error updating localStorage:", e); }
    }, [chatId, anonToken]);

    useEffect(() => {
        markChatAsRead(); // Marcar como leído al entrar/actualizar
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, markChatAsRead]);

    useEffect(() => {
        const fetchMessages = async () => {
             try {
                setLoading(true);
                const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
                if (!res.ok) throw new Error("No se pudo cargar el chat");
                const data = await res.json();
                setMessages(data.messages || []);
                if (data.creatorName) setCreatorName(data.creatorName);
            } catch (err) { setError("⚠️ Error cargando mensajes"); }
            finally { setLoading(false); }
        };
        fetchMessages();

        // --- Conexión WebSocket específica para esta vista ---
        const wsUrl = `${API.replace(/^http/, "ws")}/ws?chatId=${chatId}&anonToken=${anonToken}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                 if (msg.chatId === chatId) {
                    setMessages((prev) => {
                         if (prev.some(m => m.id === msg.id)) return prev; // Evitar duplicados
                         return [...prev, msg];
                    });
                    // Marcar como leído si la pestaña está visible
                    if (document.visibilityState === 'visible') markChatAsRead();
                }
            } catch (e) { console.error("Error procesando WebSocket (Chat View):", e); }
        };
        ws.onopen = () => console.log(`WebSocket (Chat View) conectado a chat ${chatId}`);
        ws.onerror = (error) => console.error("WebSocket (Chat View) error:", error);
        ws.onclose = () => console.log(`WebSocket (Chat View) desconectado de chat ${chatId}`);

       // Limpieza al desmontar
       return () => { if (wsRef.current) wsRef.current.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, anonToken]); // Dependencias correctas

     // Enviar mensaje
     const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim()) return;
        const tempMsgContent = newMsg;
        setNewMsg(""); // Limpia input
        try {
            const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: tempMsgContent }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error enviando"); }
            // Espera a que el WebSocket actualice los mensajes
        } catch (err) { console.error("Error enviando:", err); setError("⚠️ Error al enviar."); setNewMsg(tempMsgContent); } // Restaura si falla
    };

    // Componente Message interno para esta vista
    const Message = ({ msg, creatorName, anonAlias }) => {
        const isCreator = msg.from === "creator";
        const senderName = isCreator ? creatorName : "Tú"; // Anónimo siempre es "Tú" aquí
        // Alineación: Creador a la izq ('anon'), Anónimo a la der ('creator')
        // Estilo: Creador gris ('anon'), Anónimo púrpura ('creator')
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

    // Renderizado de PublicChatView
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
                    <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} anonAlias={anonAlias} />
                ))}
                <div ref={bottomRef} />
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
};


// --- Componente Principal de la Página ---
export default function PublicPage() {
  const params = useParams();
  const publicId = params?.publicId; // Obtener publicId de forma segura
  const router = useRouter();

  // --- GUARDA: Verificar si publicId está listo ---
  if (publicId === undefined) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white', backgroundColor: '#0d0c22' }}>
            Cargando espacio...
        </div>
     );
  }
  // --- FIN DE LA GUARDA ---

  // Estados (se inicializan solo si publicId existe)
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false); // Para el modal
  const chatsListRef = useRef(null);
  const wsRef = useRef(null); // WebSocket para la página principal

  // Cargar chats desde localStorage
  const loadChats = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      // Filtra usando el publicId que ya sabemos que está definido
      const relevantChats = stored.filter(chat => chat.creatorPublicId === publicId);
      relevantChats.sort((a, b) => new Date(b.ts) - new Date(a.ts)); // Más reciente primero
      setMyChats(relevantChats);
      return relevantChats; // Devolver los chats para el WebSocket
    } catch (error) { console.error("Error al cargar chats:", error); return []; }
  }, [publicId]); // Dependencia correcta

  // --- useEffect Corregido para WebSocket ---
  useEffect(() => {
    let relevantChats = loadChats(); // Carga inicial y obtiene los chats

    const connectWebSocket = () => {
        // Cierra conexión anterior si existe
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
        // No conectar si no hay chats
        if (relevantChats.length === 0) { console.log("No chats, WS not connecting."); return; }

        // --- Construir lista de anonTokens ---
        const anonTokensString = relevantChats.map(chat => chat.anonToken).join(',');
        if (!anonTokensString) { console.log("No valid anonTokens found."); return; }

        // --- Usar el nuevo parámetro 'anonTokens' ---
        const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => console.log(`WS (Public Page) connected for ${relevantChats.length} chats.`);
        ws.onerror = (error) => console.error("WS (Public Page) error:", error);
        ws.onclose = () => {
             console.log(`WS (Public Page) disconnected. Reconnecting...`);
             // Reconectar solo si aún hay chats (llama a loadChats para verificar)
             if (loadChats().length > 0) setTimeout(connectWebSocket, 5000);
             else console.log("No chats left, WS closed.");
        };

        // --- Lógica onmessage para actualizar "Nuevo" y título ---
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                // Recarga la lista actual de chats relevantes para asegurar la comprobación correcta
                const currentRelevantChats = loadChats();

                if (msg.from === 'creator' && currentRelevantChats.some(c => c.chatId === msg.chatId)) {
                    const currentChats = JSON.parse(localStorage.getItem("myChats") || "[]");
                    let creatorName = 'Creador'; // Default name
                    const updatedChats = currentChats.map(chat => {
                         if (chat.chatId === msg.chatId) {
                             creatorName = chat.creatorName || creatorName; // Usa el nombre guardado si existe
                             // Actualiza flag, preview y timestamp
                             return { ...chat, hasNewReply: true, preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""), ts: msg.createdAt };
                         } return chat;
                    });
                    localStorage.setItem("myChats", JSON.stringify(updatedChats));
                    loadChats(); // Actualiza el estado de la UI (ya llama a setMyChats)

                    // --- Notificación en título ---
                    if (document.hidden) {
                        if (!window.originalTitle) window.originalTitle = document.title;
                        document.title = `(1) Nuevo mensaje de ${creatorName}`;
                    }
                }
            } catch (e) { console.error("Error processing WS:", e); }
        };
    };

    connectWebSocket(); // Conexión inicial

    // --- Limpieza al desmontar ---
    return () => {
        if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
         // Limpiar título al desmontar
         if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, loadChats]); // Dependencias correctas

  // --- useEffect para restaurar título ---
  useEffect(() => {
        const handleVisibilityChange = () => {
            // Si la pestaña NO está oculta Y habíamos guardado un título original...
            if (!document.hidden && window.originalTitle) {
                document.title = window.originalTitle; // Restaura el título
                delete window.originalTitle; // Limpia la variable global
                // Opcional: Podrías marcar chats como leídos aquí si quieres
                // loadChats(); // O una lógica más específica
            }
        };
        // Añade el listener cuando el componente se monta
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Limpieza: elimina el listener cuando el componente se desmonta
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Asegúrate de limpiar el título si el componente se desmonta mientras la pestaña está inactiva
            if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; }
        };
    }, []); // El array vacío [] asegura que se ejecute solo al montar/desmontar

  // --- Funciones para el Modal (Opcional) ---
  const handleShowGuide = useCallback(() => {
    setShowGuideModal(true);
    setTimeout(() => { chatsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 500);
  }, []);
  const handleCloseGuide = useCallback(() => { setShowGuideModal(false); }, []);

  // --- handleOpenChat Actualizado ---
  const handleOpenChat = (chat) => {
    try {
        const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
        const updatedChats = storedChats.map(c => c.chatId === chat.chatId ? { ...c, hasNewReply: false } : c);
        localStorage.setItem("myChats", JSON.stringify(updatedChats));
        // Actualiza estado UI inmediatamente
        setMyChats(prev => prev.map(c => c.chatId === chat.chatId ? {...c, hasNewReply: false} : c ));
        setSelectedChat(chat);
    } catch (e) { console.error("Error opening chat:", e); setSelectedChat(chat); }
  };

  // Función formatDate (sin cambios)
  const formatDate = (dateString) => new Date(dateString).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Estilos (incluye los del modal aquí o en globals.css)
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
      position: relative;
    }
    @keyframes gradient-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .new-reply-indicator {
      display: inline-block; margin-left: 8px; padding: 3px 8px;
      background-color: var(--primary-hellfire-red); color: white;
      font-size: 10px; font-weight: bold; border-radius: 10px;
      line-height: 1; vertical-align: middle; animation: pulse-indicator 1.5s infinite;
    }
    @keyframes pulse-indicator { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
    .to-dashboard-button {
      position: absolute; top: 20px; right: 20px;
      background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff; padding: 10px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background-color 0.3s ease, transform 0.3s ease; z-index: 10;
    }
    .to-dashboard-button:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
    /* Estilos del Modal (si los pones aquí) */
  `;

  // --- Renderizado del componente ---
  return (
    <>
      <style>{pageStyles}</style>
      {/* --- Renderizar Modal (si se usa y si showGuideModal es true) --- */}
      {showGuideModal && <FirstMessageGuideModal onClose={handleCloseGuide} />}

      <div className="page-container">
        {/* Botón Home */}
        <button onClick={() => router.push('/')} className="to-dashboard-button" title="Ir a mi espacio">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        <div style={{ maxWidth: 520, width: '100%' }}>
          {selectedChat ? (
            // Vista de chat detallada
            <PublicChatView chatInfo={selectedChat} onBack={() => {setSelectedChat(null); loadChats();}} />
          ) : (
            // Vista principal (formulario y lista)
            <>
              <h1 style={{
                textAlign: 'center', marginBottom: '10px', fontSize: '26px',
                color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}>
                Envíame un Mensaje Anónimo y Abre un Chat Anónimo
              </h1>
              {/* Formulario (ahora recibe un publicId definido) */}
              <AnonMessageForm
                  publicId={publicId} // Ahora es seguro pasar publicId
                  onSent={loadChats}
                  onFirstSent={handleShowGuide} // Para el modal opcional
              />

              {/* Link Crear espacio */}
              <div className="create-space-link-container staggered-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <a href="/" className="create-space-link">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Crear tu propio espacio
                </a>
              </div>

              {/* Lista de Chats con ref */}
              <div ref={chatsListRef} className={`chats-list-section ${myChats.length > 0 ? '' : 'staggered-fade-in-up'}`}>
                {myChats.length > 0 && <h2 className="chats-list-title">Tus Chats Abiertos</h2>}
                <div className="chats-list-grid">
                  {myChats.map((chat, index) => (
                    <div key={chat.chatId} className="chat-list-item staggered-fade-in-up" style={{ animationDelay: `${0.1 * index}s` }} onClick={() => handleOpenChat(chat)}>
                      <div className="chat-list-item-main">
                        <div className="chat-list-item-alias">
                          {chat.anonAlias || "Anónimo"}
                           {/* --- Indicador Nuevo --- */}
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