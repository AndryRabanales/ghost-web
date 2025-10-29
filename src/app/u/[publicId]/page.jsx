// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import FirstMessageGuideModal from "@/components/FirstMessageGuideModal";
// --- 👇 MODIFICACIÓN 1: Importar el nuevo componente ---
import PublicChatView from "@/components/PublicChatView";
// --- 👆 FIN MODIFICACIÓN 1 👆 ---
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente PublicChatView movido a src/components/PublicChatView.jsx ---

// --- Componente Principal de la Página (PublicPage) ---
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

  // NUEVOS ESTADOS Y REFS
  const [creatorName, setCreatorName] = useState("el creador");
  const selectedChatRef = useRef(selectedChat);
  const chatsListRef = useRef(null);
  const wsRef = useRef(null);

  // 1. Ref para rastrear el estado actual de selectedChat sin forzar la reconexión de WS
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Cargar chats desde localStorage
  const loadChats = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const relevantChats = stored.filter(chat => chat.creatorPublicId === publicId);
      relevantChats.sort((a, b) => new Date(b.ts) - new Date(a.ts));

      // -> AGREGADO: Cargar el nombre del creador
      if (relevantChats.length > 0 && relevantChats[0].creatorName) {
        setCreatorName(relevantChats[0].creatorName);
      }

      setMyChats(relevantChats);
      return relevantChats; // Devolver los chats cargados para uso inmediato
    } catch (error) { console.error("Error al cargar chats:", error); return []; }
  }, [publicId]);

  // 3. ARREGLO PERSISTENCIA: Cargar chats al montar
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // 4. ARREGLO SCROLL AL RECARGAR (si hay no leídos)
  useEffect(() => {
    if (myChats.length > 0 && !selectedChat && chatsListRef.current) {
      const hasUnread = myChats.some(chat => chat.hasNewReply);
      if (hasUnread) {
        setTimeout(() => {
          chatsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [myChats, selectedChat]);

  // --- useEffect Corregido para WebSocket (CON DEPENDENCIA CLAVE) ---
  useEffect(() => {
    console.log(`WebSocket useEffect: Disparado. myChats.length: ${myChats.length}`);

    const connectWebSocket = () => {
      // Cierre de la conexión anterior
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000, "Nueva conexión de página");
      }

      const currentChatsForWS = loadChats(); // Asegurar que tenemos los chats más recientes para la conexión
      if (currentChatsForWS.length === 0) { console.log("WebSocket connect: No hay chats, no se conecta."); return; }

      const anonTokensString = currentChatsForWS.map(chat => chat.anonToken).join(',');
      if (!anonTokensString) { console.log("WebSocket connect: No se encontraron tokens válidos."); return; }

      const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonTokensString}`;
      console.log(`WebSocket connect: Intentando conectar a: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log(`WS (Public Page) connected for ${currentChatsForWS.length} chats.`);
      ws.onerror = (error) => console.error("WS (Public Page) error:", error);
      ws.onclose = (event) => {
        console.log(`WS (Public Page) disconnected. Code: ${event.code}.`);
        // Intentar reconectar si hay chats y no fue cierre limpio (1000) o por política (1008)
        if (loadChats().length > 0 && ![1000, 1008].includes(event.code)) {
          console.log("Intentando reconectar WS...");
          setTimeout(connectWebSocket, 5000); // Reintentar en 5s
        } else {
          console.log("No chats left or clean/policy close, WS closed.");
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const currentRelevantChatsOnMessage = loadChats(); // Cargar de nuevo para asegurar consistencia

          // Asegurarse de que el mensaje es del creador y pertenece a uno de los chats actuales
          if (msg.from === 'creator' && currentRelevantChatsOnMessage.some(c => c.chatId === msg.chatId)) {
            console.log("WS (Public Page) Mensaje nuevo recibido:", msg);
            const currentLocalStorageChats = JSON.parse(localStorage.getItem("myChats") || "[]");

            let nameForTitle = creatorName;

            const updatedChats = currentLocalStorageChats.map(chat => {
              if (chat.chatId === msg.chatId) {
                nameForTitle = chat.creatorName || nameForTitle;
                // --- 👇 MODIFICACIÓN 2: Guardar quién envió el último mensaje ---
                return {
                  ...chat,
                  hasNewReply: true,
                  preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""),
                  ts: msg.createdAt,
                  previewFrom: 'creator' // <-- ¡Añadido!
                };
                // --- 👆 FIN MODIFICACIÓN 2 👆 ---
              }
              return chat;
            });
            localStorage.setItem("myChats", JSON.stringify(updatedChats));
            loadChats(); // Actualiza el estado de la UI (myChats)

            if (!selectedChatRef.current && chatsListRef.current) {
              chatsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            if (document.hidden) {
              if (!window.originalTitle) window.originalTitle = document.title;
              document.title = `(1) Nuevo mensaje de ${nameForTitle}`;
            }
          }
        } catch (e) { console.error("Error processing WS:", e); }
      };
    };

    connectWebSocket();

    // --- Limpieza al desmontar ---
    return () => {
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(1000, "Componente Page desmontado"); wsRef.current = null; }
      if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; }
    };
    // Dependencia myChats.length fuerza reconexión cuando cambia de 0 a >0 o viceversa
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
      // Actualizar estado local inmediatamente para quitar el indicador
      setMyChats(prev => prev.map(c => c.chatId === chat.chatId ? { ...c, hasNewReply: false } : c));
      setSelectedChat(chat); // Seleccionar el chat para mostrar la vista detallada
    } catch (e) { console.error("Error opening chat:", e); setSelectedChat(chat); }
  };

  // Función formatDate (sin cambios)
  const formatDate = (dateString) => new Date(dateString).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // --- 👇 ESTILOS RESTAURADOS 👇 ---
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
    /* Estilos adicionales que podrías tener en globals.css */
    .unreplied-indicator { /* Tus estilos */ }
    .create-space-link-container { /* Tus estilos */ }
    .create-space-link { /* Tus estilos */ }
    .chats-list-section { /* Tus estilos */ }
    .chats-list-title { /* Tus estilos */ }
    .chats-list-grid { /* Tus estilos */ }
    .staggered-fade-in-up { /* Tus estilos */ }
    @keyframes fadeInUp { /* Tu animación */ }
  `;
  // --- 👆 FIN ESTILOS RESTAURADOS 👆 ---


  // --- Renderizado del componente ---
  return (
    <>
      {/* Aplicamos los estilos */}
      <style>{pageStyles}</style>
      {showGuideModal && <FirstMessageGuideModal onClose={handleCloseGuide} />}

      {/* Usamos la clase page-container */}
      <div className="page-container">
        {/* Botón Home */}
        <button onClick={() => router.push('/')} className="to-dashboard-button" title="Ir a mi espacio">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        {/* Contenedor del contenido principal */}
        <div style={{ maxWidth: 520, width: '100%' }}>
          {selectedChat ? (
            // --- Usamos el componente importado ---
            <PublicChatView
              chatInfo={selectedChat}
              onBack={() => { setSelectedChat(null); loadChats(); }} // Asegurarse de recargar al volver
            />
          ) : (
            <>
              {/* --- Título H1 Restaurado --- */}
              <h1 style={{
                textAlign: 'center', marginBottom: '10px', fontSize: '26px',
                color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}>
                Envíame un Mensaje Anónimo y Abre un Chat Anónimo
              </h1>
              <AnonMessageForm
                publicId={publicId}
                onSent={loadChats} // Recargar la lista después de enviar
                onFirstSent={handleShowGuide}
              />
              <div className="create-space-link-container staggered-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <a href="/" className="create-space-link">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Crear tu propio espacio
                </a>
              </div>

              {/* Lista de chats (lógica del indicador corregida) */}
              <div ref={chatsListRef} className={`chats-list-section ${myChats.length > 0 ? '' : 'staggered-fade-in-up'}`}>
                {myChats.length > 0 && <h2 className="chats-list-title">Espera a que {creatorName} te responda</h2>}
                <div className="chats-list-grid">
                  {myChats.map((chat, index) => (
                    <div key={chat.chatId} className="chat-list-item staggered-fade-in-up" style={{ animationDelay: `${0.1 * index}s` }} onClick={() => handleOpenChat(chat)}>
                      <div className="chat-list-item-main">
                        <div className="chat-list-item-alias">
                          {chat.anonAlias || "Anónimo"}
                          {/* --- 👇 Lógica del indicador corregida (ya estaba) --- */}
                          {chat.hasNewReply ? (
                            <span className="new-reply-indicator">Nueva Respuesta</span>
                          ) : (
                            // Mostrar "no respondido" SOLO si el último mensaje fue del anónimo
                            chat.previewFrom === 'anon' && (
                              <span className="unreplied-indicator">{creatorName} no ha respondido aún</span>
                            )
                            // Si previewFrom es 'creator' y hasNewReply es false, no mostramos nada (ya leíste)
                          )}
                          {/* --- 👆 Fin lógica corregida 👆 --- */}
                        </div>
                        <div className="chat-list-item-content">"{chat.preview}"</div>
                        <div className="chat-list-item-date">{formatDate(chat.ts)}</div>
                      </div>
                      <button className={`chat-list-item-button ${index === 0 ? 'pulse-open-anon' : ''}`}>Abrir</button>
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