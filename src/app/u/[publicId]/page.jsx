// src/app/u/[publicId]/page.jsx
"use client";
// Corrección de rutas de importación
import AnonMessageForm from "../../../components/AnonMessageForm";
import FirstMessageGuideModal from "../../../components/FirstMessageGuideModal";
import PublicChatView from "../../../components/PublicChatView";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { timeAgo } from "../../../utils/timeAgo";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PublicPage() {
  const params = useParams();
  const publicId = params?.publicId;
  const router = useRouter();

  if (publicId === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white', backgroundColor: '#0d0c22' }}>
        Cargando espacio...
      </div>
    );
  }

  // --- Estados ---
  const [activeChatInfo, setActiveChatInfo] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // --- Estados del Creador (ahora se cargan al inicio) ---
  const [creatorName, setCreatorName] = useState("el creador");
  const [creatorContract, setCreatorContract] = useState(null); // <-- El contrato
  const [escasezData, setEscasezData] = useState(null);
  const [isFull, setIsFull] = useState(false);
  const [creatorStatus, setCreatorStatus] = useState(null);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState(null);
  
  // --- Estados del Chat ---
  const [chatMessages, setChatMessages] = useState([]); 
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [chatError, setChatError] = useState(null); 

  const wsRef = useRef(null);

  // --- Carga el chat guardado en localStorage ---
  const loadActiveChat = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      const foundChat = stored.find(chat => chat.creatorPublicId === publicId);
      
      if (foundChat) {
        if (foundChat.creatorName) {
          setCreatorName(foundChat.creatorName);
        }
        // Cargar el contrato desde localStorage si ya existe
        if (foundChat.creatorPremiumContract) {
          setCreatorContract(foundChat.creatorPremiumContract);
        }
        return foundChat;
      }
      return null;
    } catch (error) { 
      console.error("Error al cargar chat activo:", error); 
      return null; 
    }
  }, [publicId]);

  // --- Carga el chat al inicio ---
  useEffect(() => {
    const chat = loadActiveChat();
    if (chat) {
      setActiveChatInfo(chat);
    }
  }, [loadActiveChat]);
  
  
  // --- 👇 RE-AÑADIDO: useEffect para Cargar Info Pública del Creador ---
  // (Ahora que la ruta API existe, esto funcionará)
  useEffect(() => {
    // Solo se ejecuta si NO hay un chat activo (es un nuevo visitante)
    if (!publicId || activeChatInfo) return; 

    const fetchPublicCreatorInfo = async () => {
      try {
        // Esta es la ruta que acabamos de añadir en routes/public.js
        const res = await fetch(`${API}/public/creator/${publicId}`); 
        if (!res.ok) throw new Error("No se pudo cargar la info del creador");
        
        const data = await res.json();
        
        // Seteamos los datos que necesitamos para el AnonMessageForm
        if (data.creatorName) setCreatorName(data.creatorName);
        if (data.premiumContract) setCreatorContract(data.premiumContract); // <-- ¡FUNCIONARÁ!
        if (data.escasezData) setEscasezData(data.escasezData);
        if (data.isFull) setIsFull(data.isFull);

      } catch (err) {
        console.error("Error cargando info pública del creador:", err);
      }
    };

    fetchPublicCreatorInfo();
  }, [publicId, activeChatInfo]); // Depende de publicId y activeChatInfo
  // --- 👆 FIN DEL BLOQUE RE-AÑADIDO ---


  // Cargar mensajes iniciales y conectar WebSocket (MODIFICADO)
  useEffect(() => {
    
    // 1. Timer para el "hace..." (sin cambios)
    const interval = setInterval(() => {
      setLastActiveTimestamp(prev => prev);
    }, 30000); // Actualiza cada 30 segundos
    
    // --- Función para Cargar Mensajes ---
    const fetchMessages = async (token, id) => {
      if (!token || !id) return;
      setIsChatLoading(true);
      setChatError(null);
      try {
        const res = await fetch(`${API}/chats/${token}/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el chat");
        const data = await res.json();
        setChatMessages(data.messages || []);
        
        // Cargar contrato si no se cargó al inicio (porque el chat ya existía)
        if (data.creatorPremiumContract && !creatorContract) {
            setCreatorContract(data.creatorPremiumContract);
        }

      } catch (err) { setChatError("⚠️ Error cargando mensajes"); }
      finally { setIsChatLoading(false); }
    };
    // -----------------------------------------------------------

    // 2. Conexión WebSocket Única
    const connectWebSocket = () => {
      if (wsRef.current) { 
        wsRef.current.close(1000, "Reconectando"); 
      }

      let wsUrl = `${API.replace(/^http/, "ws")}/ws?publicId=${publicId}`;
      
      if (activeChatInfo) {
        wsUrl += `&anonTokens=${activeChatInfo.anonToken}`;
        fetchMessages(activeChatInfo.anonToken, activeChatInfo.chatId);
      } else {
        setIsChatLoading(false);
        setChatMessages([]);
        setChatError(null);
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log(`WS (Public Page MAIN) conectado: ${wsUrl}`);
      ws.onerror = (error) => console.error("WS (Public Page MAIN) error:", error);
      ws.onclose = (event) => {
        console.log(`WS (Public Page MAIN) disconnected. Code: ${event.code}.`);
        if (![1000, 1008].includes(event.code)) {
          console.log("Reconectando WS (MAIN)..."); 
          setTimeout(connectWebSocket, 5000);
        }
      };

      // --- Manejador de Mensajes Unificado ---
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Handler 1: Estado del Creador
          if (msg.type === 'CREATOR_STATUS_UPDATE') {
            setCreatorStatus(msg.status);
            if (msg.status === 'offline') {
              setLastActiveTimestamp(new Date().toISOString());
            }
          }
          
          // --- HANDLER S3: Actualización de Contrato en Tiempo Real ---
          if (msg.type === 'CREATOR_INFO_UPDATE' && msg.premiumContract) {
             setCreatorContract(msg.premiumContract); 
             console.log("WS: Contrato Premium actualizado.");
          }
          // -----------------------------------------------------------

          // Handler 2: Mensajes del Chat (Actualización de la conversación)
          if (activeChatInfo && msg.chatId === activeChatInfo.chatId) {
            setChatMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            if (msg.from === 'creator') {
                 fetchMessages(activeChatInfo.anonToken, activeChatInfo.chatId);
            }
          }
        } catch (e) { console.error("Error processing WS (MAIN):", e); }
      };
    };

    connectWebSocket();
    
    // Limpieza
    return () => { 
      clearInterval(interval);
      if (wsRef.current) { 
        wsRef.current.onclose = null; 
        wsRef.current.close(1000, "Componente Page desmontado"); 
        wsRef.current = null; 
      } 
    };
  },[publicId, activeChatInfo, creatorContract]); // <-- creatorContract añadido a dependencias

  
  // --- Función para cerrar el modal (sin cambios) ---
  const handleCloseGuide = useCallback(() => { setShowGuideModal(false); }, []);

  // --- Función para cuando se crea el chat (MODIFICADA) ---
  const handleChatCreated = useCallback((newChatInfo) => {
    setActiveChatInfo(newChatInfo);
    setShowGuideModal(true);
    if (newChatInfo.creatorName) {
      setCreatorName(newChatInfo.creatorName);
    }
    // Cargar el contrato que la API devolvió al crear el chat
    if (newChatInfo.creatorPremiumContract) {
      setCreatorContract(newChatInfo.creatorPremiumContract);
    }
  }, []);

  // --- Función para Enviar Mensajes ---
  const handleSendMessage = async (content) => {
    if (!activeChatInfo || !content.trim()) return;
    const { anonToken, chatId } = activeChatInfo;
    
    try {
      const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error enviando el mensaje");
      }
      
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setChatError("⚠️ Error al enviar. Inténtalo de nuevo.");
    }
  };

  // --- Estilos (sin cambios) ---
  const pageStyles = `
    .page-container {
      background: linear-gradient(-45deg, #0d0c22, #1a1a2e, #2c1a5c, #3c287c);
      background-size: 400% 400%; animation: gradient-pan 15s ease infinite;
      min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
      align-items: center; padding: 40px 20px; font-family: var(--font-main);
      position: relative; color: var(--text-primary);
    }
    @keyframes gradient-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .to-dashboard-button { position: absolute; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; padding: 10px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color 0.3s ease, transform 0.3s ease; z-index: 10; }
    .to-dashboard-button:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
    .create-space-link-container { text-align: center; margin-top: 35px; margin-bottom: 30px; opacity: 0; }
    .create-space-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; color: var(--glow-accent-crimson); font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
    .create-space-link:hover { background-color: rgba(142, 45, 226, 0.2); border-color: var(--glow-accent-crimson); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(142, 45, 226, 0.3); }
    .create-space-link svg { transition: transform 0.3s ease; }
    .create-space-link:hover svg { transform: scale(1.1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
    .staggered-fade-in-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    
    .waiting-title-container {
      margin-bottom: 25px;
      text-align: center;
      min-height: 40px; 
    }
    .waiting-title {
      font-size: 22px; /* Tamaño que ajustaste */
      font-weight: 800;
      color: var(--text-primary);
      text-shadow: 0 0 15px rgba(255,255,255,0.4);
      animation: subtle-pulse-glow 2.5s ease-in-out infinite, fadeInUp 0.8s ease-out;
      display: inline-flex; 
      align-items: center;
      gap: 8px;
    }
    .waiting-title .waiting-dots {
      position: relative;
      top: -2px;
      margin-left: 0;
    }
  `;
  
  const lastActiveDisplay = timeAgo(lastActiveTimestamp);

  // Lógica para el título "Espera..." (ahora usa los estados del padre)
  const lastMessage = chatMessages[chatMessages.length - 1];
  const isWaitingForReplyTitle = activeChatInfo && !isChatLoading && chatMessages.length > 0 && (!lastMessage || lastMessage.from === 'anon');

  return (
    <>
      <style>{pageStyles}</style>
      {showGuideModal && <FirstMessageGuideModal onClose={handleCloseGuide} />}

      <div className="page-container">
        <button onClick={() => router.push('/')} className="to-dashboard-button" title="Ir a mi espacio">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        <div style={{ maxWidth: 520, width: '100%' }}>

          {activeChatInfo ? (
            <>
              {/* Título "Espera..." */}
              <div className="waiting-title-container">
                {isWaitingForReplyTitle && (
                  <h1 className="waiting-title">
                    Espera a que {creatorName} te responda
                    <span className="waiting-dots"><span>.</span><span>.</span><span>.</span></span>
                  </h1>
                )}
              </div>
              
              <PublicChatView
                chatId={activeChatInfo.chatId}
                anonToken={activeChatInfo.anonToken}
                creatorStatus={creatorStatus}
                lastActiveDisplay={lastActiveDisplay}
                creatorName={creatorName || "el creador"}
                messages={chatMessages}
                isLoading={isChatLoading}
                error={chatError}
                onSendMessage={handleSendMessage}
              />
            </>
          ) : (
            // Formulario de primer mensaje
            <>
              <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '26px', color: '#fff', fontWeight: 800, textShadow: '0 0 20px rgba(255, 255, 255, 0.3)', animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
                Envíale un Mensaje Anónimo a {creatorName}
              </h1>
              
              {/* Se pasan los estados (ahora sí se cargan al inicio) */}
              <AnonMessageForm
                publicId={publicId}
                onChatCreated={handleChatCreated}
                escasezData={escasezData} 
                isFull={isFull} 
                creatorContract={creatorContract} 
              />
              <div className="create-space-link-container staggered-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <a href="/" className="create-space-link">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Crear tu propio espacio
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}