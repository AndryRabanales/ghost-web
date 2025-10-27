// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import FirstMessageGuideModal from "@/components/FirstMessageGuideModal"; // Modal Opcional
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// -------------------------------------------------------------------
// --- Componente PublicChatView (Vista Detallada del Chat) ---
// -------------------------------------------------------------------
const PublicChatView = ({ chatInfo, onBack }) => {
    const { anonToken, chatId, creatorName: initialCreatorName } = chatInfo;
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [creatorName, setCreatorName] = useState(initialCreatorName || "Respuesta");
    const [anonAlias, setAnonAlias] = useState("Tú");
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

    useEffect(() => {
        markChatAsRead(); 
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

        // 1. CERRAR CONEXIÓN ANTERIOR ANTES DE ABRIR NUEVA (si se re-ejecuta)
        if (wsRef.current) {
            wsRef.current.onclose = null; 
            wsRef.current.close(1000, "Re-ejecución de useEffect");
        }

        const wsUrl = `${API.replace(/^http/, "ws")}/ws?chatId=${chatId}&anonToken=${anonToken}`;
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
        
        // CIERRE DETALLADO
        ws.onclose = (event) => {
             console.log(`WebSocket (Chat View) desconectado de chat ${chatId}. Code: ${event.code}.`);
             if (event.code === 1008) {
                 setError("La sesión de chat expiró o fue rechazada por seguridad.");
             }
        };

       // LIMPIEZA AL DESMONTAR
       return () => { 
           if (wsRef.current) {
               wsRef.current.onclose = null; 
               wsRef.current.close(1000, "Componente desmontado limpiamente");
               wsRef.current = null;
           } 
       };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, anonToken]); 

     // Enviar mensaje
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
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error enviando"); }
        } catch (err) { console.error("Error enviando:", err); setError("⚠️ Error al enviar."); setNewMsg(tempMsgContent); }
    };

    // Componente Message interno para esta vista
    const Message = ({ msg, creatorName, anonAlias }) => {
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


// -------------------------------------------------------------------
// --- Componente Principal de la Página (PublicPage) ---
// -------------------------------------------------------------------
export default function PublicPage() {
  const params = useParams();
  const publicId = params?.publicId; // Obtener publicId de forma segura
  const router = useRouter();

  // --- GUARDA: Verificar si publicId está listo (SOLUCION ERROR DE COMPILACIÓN) ---
  if (publicId === undefined) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white', backgroundColor: '#0d0c22' }}>
            Cargando espacio...
        </div>
     );
  }
  // --- FIN DE LA GUARDA ---

  // Estados
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false); 
  const chatsListRef = useRef(null);
  const wsRef = useRef(null); 

  // Cargar chats desde localStorage
  const loadChats = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const relevantChats = stored.filter(chat => chat.creatorPublicId === publicId);
      relevantChats.sort((a, b) => new Date(b.ts) - new Date(a.ts)); 
      setMyChats(relevantChats);
      return relevantChats; 
    } catch (error) { console.error("Error al cargar chats:", error); return []; }
  }, [publicId]); 

  // --- useEffect Corregido para WebSocket (CON DEPENDENCIA CLAVE) ---
  useEffect(() => {
    console.log(`WebSocket useEffect: Disparado. myChats.length: ${myChats.length}`);

    const connectWebSocket = () => {
        // Cierre de la conexión anterior
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.onclose = null; 
            wsRef.current.close(1000, "Nueva conexión de página");
        }
        
        if (myChats.length === 0) { console.log("WebSocket connect: No hay chats, no se conecta."); return; }

        const anonTokensString = myChats.map(chat => chat.anonToken).join(',');
        if (!anonTokensString) { console.log("WebSocket connect: No se encontraron tokens válidos."); return; }

        const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
        console.log(`WebSocket connect: Intentando conectar a: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => console.log(`WS (Public Page) connected for ${myChats.length} chats.`);
        ws.onerror = (error) => console.error("WS (Public Page) error:", error);
        
        ws.onclose = (event) => {
             console.log(`WS (Public Page) disconnected. Code: ${event.code}.`);
             if (loadChats().length > 0 && event.code !== 1000) setTimeout(connectWebSocket, 5000); 
             else console.log("No chats left or clean close, WS closed.");
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                const currentRelevantChats = loadChats();

                if (msg.from === 'creator' && currentRelevantChats.some(c => c.chatId === msg.chatId)) {
                    console.log("WS (Public Page) Mensaje nuevo recibido:", msg);
                    const currentChats = JSON.parse(localStorage.getItem("myChats") || "[]");
                    let creatorName = 'Creador';
                    const updatedChats = currentChats.map(chat => {
                         if (chat.chatId === msg.chatId) {
                             creatorName = chat.creatorName || creatorName;
                             return { ...chat, hasNewReply: true, preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""), ts: msg.createdAt };
                         } return chat;
                    });
                    localStorage.setItem("myChats", JSON.stringify(updatedChats));
                    loadChats(); // Actualiza el estado de la UI (myChats)

                    if (document.hidden) {
                        if (!window.originalTitle) window.originalTitle = document.title;
                        document.title = `(1) Nuevo mensaje de ${creatorName}`;
                    }
                }
            } catch (e) { console.error("Error processing WS:", e); }
        };
    };

    connectWebSocket(); 

    // --- Limpieza al desmontar ---
    return () => {
        if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(1000, "Componente Page desmontado"); }
         if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; }
    };
  
  // --- ARREGLO CLAVE: myChats.length fuerza la conexión después del primer envío ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, loadChats, myChats.length]); 

  // --- useEffect para restaurar título (sin cambios) ---
  useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && window.originalTitle) {
                document.title = window.originalTitle; delete window.originalTitle;
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; } };
    }, []); 

  // --- Funciones para el Modal ---
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
        setMyChats(prev => prev.map(c => c.chatId === chat.chatId ? {...c, hasNewReply: false} : c ));
        setSelectedChat(chat);
    } catch (e) { console.error("Error opening chat:", e); setSelectedChat(chat); }
  };

  // Función formatDate (sin cambios)
  const formatDate = (dateString) => new Date(dateString).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Estilos (simulamos los que tienes en globals.css para la demostración)
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
    .chat-list-item { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 18px 20px; background: rgba(26, 26, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease; overflow: hidden; position: relative; }
    .chat-list-item-main { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; overflow: hidden; }
    .chat-list-item-alias { font-weight: 700; font-size: 16px; color: #f5f5f5; white-space: nowrap; }
    .chat-list-item-content { font-style: italic; color: rgba(235, 235, 245, 0.7); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chat-list-item-date { font-size: 12px; color: rgba(235, 235, 245, 0.5); font-family: var(--font-mono); }
    .chat-list-item-button { flex-shrink: 0; padding: 8px 16px; font-size: 14px; font-weight: 600; color: #fff; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; transition: background-color 0.3s ease, border-color 0.3s ease; }
    .public-chat-view { background: rgba(20, 20, 35, 0.7); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); padding: 25px; display: flex; flex-direction: column; height: 600px; max-height: 80vh; width: 100%; opacity: 0; transform: translateY(20px); animation: fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .chat-view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .messages-display { flex-grow: 1; overflow-y: auto; padding-right: 10px; margin-bottom: 20px; }
  `;

  // --- Renderizado del componente ---
  return (
    <>
      <style>{pageStyles}</style>
      {showGuideModal && <FirstMessageGuideModal onClose={handleCloseGuide} />}

      <div className="page-container">
        {/* Botón Home */}
        <button onClick={() => router.push('/')} className="to-dashboard-button" title="Ir a mi espacio">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        <div style={{ maxWidth: 520, width: '100%' }}>
          {selectedChat ? (
            <PublicChatView chatInfo={selectedChat} onBack={() => {setSelectedChat(null); loadChats();}} />
          ) : (
            <>
              <h1 style={{
                textAlign: 'center', marginBottom: '10px', fontSize: '26px',
                color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}>
                Envíame un Mensaje Anónimo y Abre un Chat Anónimo
              </h1>
              <AnonMessageForm
                  publicId={publicId} 
                  onSent={loadChats}
                  onFirstSent={handleShowGuide} 
              />
              <div className="create-space-link-container staggered-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <a href="/" className="create-space-link">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Crear tu propio espacio
                </a>
              </div>
              <div ref={chatsListRef} className={`chats-list-section ${myChats.length > 0 ? '' : 'staggered-fade-in-up'}`}>
                {myChats.length > 0 && <h2 className="chats-list-title">Tus Chats Abiertos</h2>}
                <div className="chats-list-grid">
                  {myChats.map((chat, index) => (
                    <div key={chat.chatId} className="chat-list-item staggered-fade-in-up" style={{ animationDelay: `${0.1 * index}s` }} onClick={() => handleOpenChat(chat)}>
                      <div className="chat-list-item-main">
                        <div className="chat-list-item-alias">
                          {chat.anonAlias || "Anónimo"}
                           {chat.hasNewReply && <span className="new-reply-indicator">Nuevo Mensaje</span>}
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