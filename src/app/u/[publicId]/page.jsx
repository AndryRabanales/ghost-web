// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import FirstMessageGuideModal from "@/components/FirstMessageGuideModal";
import PublicChatView from "@/components/PublicChatView"; // Importamos el componente extraído
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente Principal de la Página (PublicPage) ---
export default function PublicPage() {
  const params = useParams();
  const publicId = params?.publicId;
  const router = useRouter();

  // --- GUARDA ---
  if (publicId === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white', backgroundColor: '#0d0c22' }}>
        Cargando espacio...
      </div>
    );
  }

  // --- Estados ---
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [creatorName, setCreatorName] = useState("el creador");
  const selectedChatRef = useRef(selectedChat);
  const chatsListRef = useRef(null);
  const wsRef = useRef(null);

  // --- useEffect y useCallback (sin cambios funcionales, solo restauramos estilos) ---
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  const loadChats = useCallback(() => { /* ... (código loadChats sin cambios) ... */
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const relevantChats = stored.filter(chat => chat.creatorPublicId === publicId);
      relevantChats.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      if (relevantChats.length > 0 && relevantChats[0].creatorName) {
        setCreatorName(relevantChats[0].creatorName);
      }
      setMyChats(relevantChats);
      return relevantChats;
    } catch (error) { console.error("Error al cargar chats:", error); return []; }
  }, [publicId]);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => { /* ... (código scroll sin cambios) ... */
    if (myChats.length > 0 && !selectedChat && chatsListRef.current) {
      const hasUnread = myChats.some(chat => chat.hasNewReply);
      if (hasUnread) {
        setTimeout(() => {
          chatsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [myChats, selectedChat]);

  useEffect(() => { /* ... (código WebSocket con correcciones del bug, sin cambios) ... */
    console.log(`WebSocket useEffect: Disparado. myChats.length: ${myChats.length}`);
    const connectWebSocket = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.onclose = null; wsRef.current.close(1000, "Nueva conexión de página");
      }
      const currentChatsForWS = loadChats();
      if (currentChatsForWS.length === 0) { console.log("WebSocket connect: No hay chats."); return; }
      const anonTokensString = currentChatsForWS.map(chat => chat.anonToken).join(',');
      if (!anonTokensString) { console.log("WebSocket connect: No tokens."); return; }
      const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
      console.log(`WebSocket connect: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => console.log(`WS (Public Page) connected for ${currentChatsForWS.length} chats.`);
      ws.onerror = (error) => console.error("WS (Public Page) error:", error);
      ws.onclose = (event) => {
        console.log(`WS (Public Page) disconnected. Code: ${event.code}.`);
        if (loadChats().length > 0 && ![1000, 1008].includes(event.code)) {
          console.log("Reconectando WS..."); setTimeout(connectWebSocket, 5000);
        } else { console.log("WS closed."); }
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const currentRelevantChatsOnMessage = loadChats();
          if (msg.from === 'creator' && currentRelevantChatsOnMessage.some(c => c.chatId === msg.chatId)) {
            console.log("WS (Public Page) Mensaje nuevo:", msg);
            const currentLocalStorageChats = JSON.parse(localStorage.getItem("myChats") || "[]");
            let nameForTitle = creatorName;
            const updatedChats = currentLocalStorageChats.map(chat => {
              if (chat.chatId === msg.chatId) {
                nameForTitle = chat.creatorName || nameForTitle;
                return { ...chat, hasNewReply: true, preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""), ts: msg.createdAt, previewFrom: 'creator' }; // <-- Bug fix
              } return chat;
            });
            localStorage.setItem("myChats", JSON.stringify(updatedChats));
            loadChats();
            if (!selectedChatRef.current && chatsListRef.current) { chatsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            if (document.hidden) { if (!window.originalTitle) window.originalTitle = document.title; document.title = `(1) Nuevo mensaje de ${nameForTitle}`; }
          }
        } catch (e) { console.error("Error processing WS:", e); }
      };
    };
    connectWebSocket();
    return () => { if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(1000, "Componente Page desmontado"); wsRef.current = null; } if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, loadChats, myChats.length]);

  useEffect(() => { /* ... (código restaurar título sin cambios) ... */
    const handleVisibilityChange = () => { if (!document.hidden && window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; } };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; } };
  }, []);

  const handleShowGuide = useCallback(() => { /* ... (código modal sin cambios) ... */
    setShowGuideModal(true);
    setTimeout(() => { chatsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 500);
  }, []);
  const handleCloseGuide = useCallback(() => { setShowGuideModal(false); }, []);

  const handleOpenChat = (chat) => { /* ... (código abrir chat sin cambios) ... */
    try {
      const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
      const updatedChats = storedChats.map(c => c.chatId === chat.chatId ? { ...c, hasNewReply: false } : c);
      localStorage.setItem("myChats", JSON.stringify(updatedChats));
      setMyChats(prev => prev.map(c => c.chatId === chat.chatId ? { ...c, hasNewReply: false } : c));
      setSelectedChat(chat);
    } catch (e) { console.error("Error opening chat:", e); setSelectedChat(chat); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // --- 👇 REINTEGRACIÓN DE ESTILOS 👇 ---
  const pageStyles = `
    .page-container {
      background: linear-gradient(-45deg, #0d0c22, #1a1a2e, #2c1a5c, #3c287c);
      background-size: 400% 400%;
      animation: gradient-pan 15s ease infinite;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px; /* Asegura padding */
      font-family: var(--font-main);
      position: relative;
      color: var(--text-primary); /* Color de texto por defecto */
    }
    @keyframes gradient-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

    /* Asegúrate que estos estilos existen en globals.css o defínelos aquí */
    .new-reply-indicator { display: inline-block; margin-left: 8px; padding: 3px 8px; background-color: var(--primary-hellfire-red); color: white; font-size: 10px; font-weight: bold; border-radius: 10px; line-height: 1; vertical-align: middle; animation: pulse-indicator 1.5s infinite; }
    @keyframes pulse-indicator { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
    .unreplied-indicator { display: inline-block; margin-left: 8px; padding: 3px 8px; background-color: #ff1641; color: rgb(255, 255, 255); font-size: 10px; font-weight: 500; border-radius: 10px; line-height: 1; vertical-align: middle; animation: none; }
    .to-dashboard-button { position: absolute; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; padding: 10px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color 0.3s ease, transform 0.3s ease; z-index: 10; }
    .to-dashboard-button:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
    .chat-list-item { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 18px 20px; background: rgba(26, 26, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease; overflow: hidden; position: relative; }
    .chat-list-item-main { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; overflow: hidden; }
    .chat-list-item-alias { font-weight: 700; font-size: 16px; color: #f5f5f5; white-space: nowrap; }
    .chat-list-item-content { font-style: italic; color: rgba(235, 235, 245, 0.7); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chat-list-item-date { font-size: 12px; color: rgba(235, 235, 245, 0.5); font-family: var(--font-mono); }
    .chat-list-item-button { flex-shrink: 0; padding: 8px 16px; font-size: 14px; font-weight: 600; color: #fff; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; transition: background-color 0.3s ease, border-color 0.3s ease; }
    .chat-list-item:hover .chat-list-item-button { background-color: #8e2de2; border-color: #8e2de2; }
    .create-space-link-container { text-align: center; margin-top: 35px; margin-bottom: 30px; opacity: 0; }
    .create-space-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; color: var(--glow-accent-crimson); font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
    .create-space-link:hover { background-color: rgba(142, 45, 226, 0.2); border-color: var(--glow-accent-crimson); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(142, 45, 226, 0.3); }
    .create-space-link svg { transition: transform 0.3s ease; }
    .create-space-link:hover svg { transform: scale(1.1); }
    .chats-list-section { margin-top: 35px; width: 100%; opacity: 0; transform: translateY(20px); animation: fadeInUp 0.8s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .chats-list-title { color: white; border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 15px; margin-bottom: 25px; font-size: 22px; font-weight: 700; }
    .chats-list-grid { display: grid; gap: 15px; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
    .staggered-fade-in-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .pulse-open-anon { animation: neon-pulse-anon 1.5s infinite ease-in-out; border-color: var(--glow-accent-crimson) !important; }
    @keyframes neon-pulse-anon { /* ... (definición de neon-pulse-anon) ... */ 0% { transform: scale(1); box-shadow: 0 0 5px var(--glow-accent-crimson), inset 0 0 5px var(--glow-accent-crimson); } 50% { transform: scale(1.05); box-shadow: 0 0 20px var(--glow-accent-crimson), inset 0 0 10px var(--glow-accent-crimson); } 100% { transform: scale(1); box-shadow: 0 0 5px var(--glow-accent-crimson), inset 0 0 5px var(--glow-accent-crimson); } }
    .chat-list-item:hover .pulse-open-anon { animation-play-state: paused; transform: translateY(-5px) scale(1.02); background: #8e2de2 !important; border-color: #8e2de2 !important; }

  `;
  // --- 👆 FIN REINTEGRACIÓN DE ESTILOS 👆 ---

  return (
    <>
      <style>{pageStyles}</style>
      {showGuideModal && <FirstMessageGuideModal onClose={handleCloseGuide} />}

      <div className="page-container"> {/* Clase aplicada aquí */}
        <button onClick={() => router.push('/')} className="to-dashboard-button" title="Ir a mi espacio">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        <div style={{ maxWidth: 520, width: '100%' }}>
          {selectedChat ? (
            <PublicChatView
              chatInfo={selectedChat}
              onBack={() => { setSelectedChat(null); loadChats(); }}
            />
          ) : (
            <>
              <h1 style={{
                textAlign: 'center', marginBottom: '30px', /* Aumentamos margen inferior */ fontSize: '26px',
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

              {/* ===== INICIO DE LA LISTA DE CHATS (LOS MENSAJES DE ABAJO) ===== */}
              <div ref={chatsListRef} className={`chats-list-section ${myChats.length > 0 ? '' : 'staggered-fade-in-up'}`}>
                {myChats.length > 0 && <h2 className="chats-list-title">Espera a que {creatorName} te responda</h2>}
                <div className="chats-list-grid">
                  {myChats.map((chat, index) => (
                    <div key={chat.chatId} className="chat-list-item staggered-fade-in-up" style={{ animationDelay: `${0.1 * index}s` }} onClick={() => handleOpenChat(chat)}>
                      <div className="chat-list-item-main">
                        <div className="chat-list-item-alias">
                          {chat.anonAlias || "Anónimo"}
                          {/* --- Lógica del indicador corregida --- */}
                          {chat.hasNewReply ? (
                            <span className="new-reply-indicator">Nueva Respuesta</span>
                          ) : (
                            chat.previewFrom === 'anon' && (
                              <span className="unreplied-indicator">{creatorName} no ha respondido aún</span>
                            )
                          )}
                          {/* --- Fin lógica corregida --- */}
                        </div>
                        <div className="chat-list-item-content">"{chat.preview}"</div>
                        <div className="chat-list-item-date">{formatDate(chat.ts)}</div>
                      </div>
                      <button className={`chat-list-item-button ${index === 0 ? 'pulse-open-anon' : ''}`}>Abrir</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* ===== FIN DE LA LISTA DE CHATS ===== */}
            </>
          )}
        </div>
      </div>
    </>
  );
}