// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import FirstMessageGuideModal from "@/components/FirstMessageGuideModal";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente PublicChatView (CORRECCIÓN DE WEBSOCKET ROBUSTA) ---
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

        // -----------------------------------------------------
        // --- CONEXIÓN WEB SOCKET PARA LA VISTA DEL CHAT ---
        // -----------------------------------------------------
        const wsUrl = `${API.replace(/^http/, "ws")}/ws?chatId=${chatId}&anonToken=${anonToken}`;
        
        // CERRAR CUALQUIER CONEXIÓN ANTERIOR DE ESTE COMPONENTE
        if (wsRef.current) {
            wsRef.current.onclose = null; 
            wsRef.current.close(1000, "Re-ejecución de useEffect");
        }

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

       // LIMPIEZA AL DESMONTAR: MÁS ROBUSTA PARA PREVENIR EL CIERRE INESPERADO
       return () => { 
           if (wsRef.current) {
               // Prevenir que onclose se ejecute si cerramos manualmente
               wsRef.current.onclose = null; 
               // Usamos un código de cierre limpio (1000) para evitar logs de error en consola
               wsRef.current.close(1000, "Componente desmontado limpiamente");
               wsRef.current = null;
           } 
       };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, anonToken]); // Dependencias correctas

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


// --- Componente Principal de la Página ---
export default function PublicPage() {
  const params = useParams();
  const publicId = params?.publicId; // Obtener publicId de forma segura
  const router = useRouter();

  // --- GUARDA: Verificar si publicId está listo (SOLUCIÓN ERROR) ---
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

  // --- useEffect Corregido para WebSocket (CON DEPENDENCIA Y LOGS) ---
  useEffect(() => {
    console.log(`WebSocket useEffect: Disparado. myChats.length: ${myChats.length}`);

    const connectWebSocket = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.onclose = null; // Evitar reconexión anterior
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
                    loadChats(); // Actualiza el estado de la UI

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
  
  // --- ARREGLO CLAVE: Se re-ejecuta al cambiar el número de chats ---
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

  // --- Funciones para el Modal (sin cambios) ---
  const handleShowGuide = useCallback(() => {
    setShowGuideModal(true);
    setTimeout(() => { chatsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 500);
  }, []);
  const handleCloseGuide = useCallback(() => { setShowGuideModal(false); }, []);

  // --- handleOpenChat Actualizado (sin cambios) ---
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

  // Estilos (incluye los del modal aquí o en globals.css)
  const pageStyles = `
    .page-container { /* ... */ }
    @keyframes gradient-pan { /* ... */ }
    /* ... Estilos del modal y la lista ... */
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
              <h1 style={{ /* ... */ }}>Envíame un Mensaje Anónimo y Abre un Chat Anónimo</h1>
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