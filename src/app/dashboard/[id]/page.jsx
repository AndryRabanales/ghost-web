// src/app/dashboard/[[...path]]/page.jsx
"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";

import ChatList from "@/components/ChatList";
import CreatorChatView from "@/components/CreatorChatView";
import AuthModal from "@/components/AuthModal";
import SettingsModal from "@/components/SettingsModal";
import ShareLinkGuideModal from "@/components/ShareLinkGuideModal"; // <-- Importa el nuevo modal

// ... (El resto de tus imports) ...

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const path = params?.path || [];
  const activeChatId = path[1];

  // --- Estados ---
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [creatorName, setCreatorName] = useState("Cargando...");
  const [publicId, setPublicId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareGuideModal, setShowShareGuideModal] = useState(false); // <-- Nuevo estado para el modal de compartir
  const wsRef = useRef(null);
  const latestChats = useRef(chats);

  useEffect(() => { latestChats.current = chats; }, [chats]);

  const publicLink = useMemo(() => {
    if (!publicId) return "";
    return `${window.location.origin}/u/${publicId}`;
  }, [publicId]);

  // --- Función de Carga de Chats ---
  const loadChats = useCallback(async (authToken) => {
    // ... (Tu función loadChats existente, sin cambios) ...
    if (!authToken) return;
    try {
      const res = await fetch(`${API}/creator/chats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { // Token inválido o expirado
          Cookies.remove("token");
          setToken(null);
          router.push("/"); // O redirigir a login
          return;
        }
        throw new Error(data.error || "Error al cargar chats");
      }
      setChats(data.chats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
      if (data.creator) {
        setCreatorName(data.creator.name);
        setPublicId(data.creator.publicId);
        setIsPremium(data.creator.isPremium);

        // --- 👇 Lógica para mostrar el modal de compartir 👇 ---
        const hasSeenShareGuide = localStorage.getItem("hasSeenShareGuide");
        // Mostrar si: no ha visto la guía, no hay chats Y no estamos en un chat específico
        if (!hasSeenShareGuide && data.chats.length === 0 && !activeChatId) {
          setShowShareGuideModal(true);
        }
        // --- 👆 Fin lógica modal de compartir 👆 ---

      }
    } catch (error) {
      console.error("Error loading chats:", error);
      //setError(error.message); // Si tienes un estado para errores generales
    } finally {
      setLoading(false);
    }
  }, [router, activeChatId]);


  // --- WebSocket Connection ---
  useEffect(() => {
    // ... (Tu lógica de WebSocket existente, sin cambios) ...
    // Asegúrate de que este useEffect se dispare si el token cambia, lo cual ya debería hacer
    if (!token) {
        if (wsRef.current) { wsRef.current.close(1000, "Token removed"); wsRef.current = null; }
        return;
    }
    const connectWebSocket = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.onclose = null; // Prevent multiple reconnects from previous instances
            wsRef.current.close(1000, "New connection initiated");
        }

        const wsUrl = `${API.replace(/^http/, "ws")}/ws?token=${token}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => console.log("WS (Dashboard) connected.");
        ws.onerror = (error) => console.error("WS (Dashboard) error:", error);
        ws.onclose = (event) => {
            console.log(`WS (Dashboard) disconnected. Code: ${event.code}.`);
            if (event.code !== 1000 && event.code !== 1008) { // 1000 = normal closure, 1008 = policy violation (e.g., bad token)
                console.log("Reconnecting WS (Dashboard)...");
                setTimeout(connectWebSocket, 5000);
            }
        };
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.from === 'anon') {
                    console.log("WS (Dashboard) New anon message:", msg);
                    const newChatId = msg.chatId;
                    const anonAlias = msg.anonAlias; // Obtener el alias del mensaje
                    // Optimistic UI update for new chat
                    const currentChats = latestChats.current; // Use ref to get latest state
                    let chatFound = false;
                    const updatedChats = currentChats.map(chat => {
                        if (chat.chatId === newChatId) {
                            chatFound = true;
                            return { ...chat, hasNewMessage: true, lastMessageAt: msg.createdAt, preview: msg.content, previewFrom: 'anon' };
                        }
                        return chat;
                    });

                    if (!chatFound) {
                        // This is a brand new chat, add it to the list
                        const newChat = {
                            chatId: newChatId,
                            anonAlias: anonAlias || 'Anónimo', // Usa el alias del mensaje
                            lastMessageAt: msg.createdAt,
                            hasNewMessage: true,
                            preview: msg.content,
                            previewFrom: 'anon',
                            messages: [{ content: msg.content, from: 'anon', createdAt: msg.createdAt }],
                        };
                        updatedChats.unshift(newChat); // Añadir al principio
                    }
                    setChats(updatedChats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
                    if (document.hidden && newChatId !== activeChatId) { // Only notify if tab is hidden and not in active chat
                        const count = updatedChats.filter(chat => chat.hasNewMessage).length;
                        if (!window.originalTitle) window.originalTitle = document.title;
                        document.title = `(${count}) Nuevo mensaje!`;
                    }
                } else if (msg.type === 'message_read' && msg.chatId === activeChatId) {
                    // Update only the actively viewed chat to remove 'hasNewMessage' flag
                    setChats(prevChats => prevChats.map(chat =>
                        chat.chatId === msg.chatId ? { ...chat, hasNewMessage: false } : chat
                    ));
                }
            } catch (e) {
                console.error("Error processing WS (Dashboard) message:", e);
            }
        };
    };
    connectWebSocket();
    return () => {
        if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(1000, "Componente DashboardPage desmontado"); wsRef.current = null; }
        if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; }
    };
  }, [token, API, activeChatId]); // Dependencias del WebSocket

  useEffect(() => { /* ... (Lógica de Cookies y Token existente) ... */
    const storedToken = Cookies.get("token");
    if (storedToken) {
      setToken(storedToken);
      loadChats(storedToken);
    } else {
      setLoading(false);
      setShowAuthModal(true);
      setAuthMode("login");
    }
  }, [loadChats]);

  useEffect(() => { /* ... (Lógica de Visibilidad y Título existente) ... */
    const handleVisibilityChange = () => { if (!document.hidden && window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; } };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); if (window.originalTitle) { document.title = window.originalTitle; delete window.originalTitle; } };
  }, []);

  useEffect(() => { /* ... (Lógica de selección de chat existente) ... */
    if (activeChatId) {
      const chatToSelect = chats.find((chat) => chat.chatId === activeChatId);
      if (chatToSelect) {
        setSelectedChat(chatToSelect);
      } else if (!loading) {
        // Chat no encontrado, podría ser un ID inválido o no cargado aún
        console.warn(`Chat with ID ${activeChatId} not found.`);
        // Podrías redirigir de vuelta al dashboard principal o mostrar un mensaje de error.
        router.push("/dashboard");
      }
    } else {
      setSelectedChat(null);
    }
  }, [activeChatId, chats, loading, router]);


  // --- Funciones para Modales ---
  const handleLoginSuccess = (newToken, newPublicId, newCreatorName, newIsPremium, newHasChats) => {
    setToken(newToken);
    setPublicId(newPublicId);
    setCreatorName(newCreatorName);
    setIsPremium(newIsPremium);
    setShowAuthModal(false);
    loadChats(newToken); // Recarga los chats con el nuevo token

    // Si el usuario acaba de iniciar sesión/registrarse y no tiene chats
    const hasSeenShareGuide = localStorage.getItem("hasSeenShareGuide");
    if (!hasSeenShareGuide && !newHasChats) {
      setShowShareGuideModal(true);
    }
  };

  const closeShareGuideModal = () => {
    localStorage.setItem("hasSeenShareGuide", "true"); // Marca que ya vio la guía
    setShowShareGuideModal(false);
  };

  if (loading) return <div className="loading-screen">Cargando dashboard...</div>;

  return (
    <div className="dashboard-layout">
      {/* ... (Tu botón de ajustes, avatar, etc.) ... */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Image src="/ghost-logo.png" alt="Ghost App Logo" width={40} height={40} />
          <span>{creatorName}</span>
          {isPremium && <span className="premium-badge">Premium</span>}
          <button onClick={() => setShowSettingsModal(true)} className="settings-button" title="Ajustes">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.125 1.125 0 011.924.97l-.756 3.024a1.125 1.125 0 001.292 1.292l3.024-.756c1.756-.426 1.756 2.924 0 3.35l-3.024.756a1.125 1.125 0 00-1.292 1.292l.756 3.024c.426 1.756-1.756 2.924 0 3.35l-.756 3.024a1.125 1.125 0 00-1.292 1.292l3.024-.756c1.756-.426 1.756 2.924 0 3.35l-3.024.756a1.125 1.125 0 00-1.292 1.292l.756 3.024c.426 1.756-2.924 1.756-3.35 0a1.125 1.125 0 01-1.924-.97l.756-3.024a1.125 1.125 0 00-1.292-1.292l-3.024.756c-1.756.426-2.924-1.756 0-3.35l3.024-.756a1.125 1.125 0 001.292-1.292l-.756-3.024c-.426-1.756.756-2.924 0-3.35l.756-3.024a1.125 1.125 0 01-1.292-1.292l-3.024.756z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg>
          </button>
        </div>

        {/* --- 👇 Contenedor del Link Público (con botón de copiar) 👇 --- */}
        <div className="public-link-container">
          <p className="public-link-title">
            <span role="img" aria-label="sparkles">✨</span> Link Público (compártelo en tus redes sociales)
          </p>
          <div className="public-link-input-group">
            <input
              type="text"
              readOnly
              value={publicLink}
              className="public-link-input"
              onClick={(e) => e.target.select()} // Para seleccionar todo el texto al hacer click
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicLink);
                // Opcional: Mostrar un pequeño mensaje de "Copiado!" temporalmente
                alert("¡Link copiado al portapapeles!");
              }}
              className="copy-button"
              title="Copiar link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H9.75a1.125 1.125 0 01-1.125-1.125V17.25m12 0v-4.125c0-.621-.504-1.125-1.125-1.125h-4.125m5.25 5.25L17.25 17.25m0 0L21 13.5m-3.75 3.75l-3.75-3.75M3.75 16.5V20.25c0 .621.504 1.125 1.125 1.125h4.5a1.125 1.125 0 001.125-1.125V16.5m-1.5-4.5H3.75c-.621 0-1.125-.504-1.125-1.125V4.875c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v4.5m-13.5 0H12" /></svg>
              Copiar
            </button>
          </div>
        </div>
        {/* --- 👆 Fin Contenedor del Link Público 👆 --- */}

        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={chat => router.push(`/dashboard/${chat.chatId}`)}
          creatorName={creatorName}
          publicId={publicId}
          isPremium={isPremium}
        />
      </div>

      <div className="main-content">
        {selectedChat ? (
          <CreatorChatView
            chatInfo={selectedChat}
            token={token}
            creatorName={creatorName}
            isPremium={isPremium}
            onBack={() => {
              setSelectedChat(null);
              router.push("/dashboard");
              loadChats(token); // Recargar chats para actualizar indicadores
            }}
            onMarkAsRead={(chatId) => {
              setChats(prevChats => prevChats.map(chat =>
                chat.chatId === chatId ? { ...chat, hasNewMessage: false } : chat
              ));
            }}
          />
        ) : (
          <div className="no-chat-selected">
            <Image src="/ghost-icon.png" alt="Ghost Icon" width={100} height={100} />
            <h2>Selecciona un chat para empezar a responder</h2>
            <p>Tus mensajes anónimos aparecerán aquí.</p>
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleLoginSuccess}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          token={token}
          creatorName={creatorName}
          publicId={publicId}
          isPremium={isPremium}
          onNameUpdate={(newName) => setCreatorName(newName)}
        />
      )}

      {/* --- 👇 Nuevo Modal de Guía de Compartir 👇 --- */}
      {showShareGuideModal && (
        <ShareLinkGuideModal
          onClose={closeShareGuideModal}
          publicLink={publicLink}
        />
      )}
      {/* --- 👆 Fin Nuevo Modal de Guía de Compartir 👆 --- */}

    </div>
  );
}