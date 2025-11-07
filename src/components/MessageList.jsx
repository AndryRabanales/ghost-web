// src/components/MessageList.jsx
"use client";
// --- MODIFICADO: Importar useState y useRef ---
import { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Iconos (sin cambios) ---
const IconResponder = () => ( /* ... */ );
const IconVer = () => ( /* ... */ );
const IconEspera = () => ( /* ... */ );

// --- SUBCOMPONENTE ChatItem (MODIFICADO) ---
// --- Añadida la prop 'isOnline' ---
const ChatItem = ({ chat, onOpenChat, disabled, minutesNext, isOnline }) => {
  const preview = chat.previewMessage;

  const getButtonContent = () => { /* ... (sin cambios) ... */
    if (disabled) {
      return (
        <>
          <IconEspera />
          {minutesNext > 0 ? `${minutesNext}m` : "..."}
        </>
      );
    }
    if (chat.anonReplied) {
      return (
        <>
          <IconResponder />
          Responder
        </>
      );
    }
    if (chat.isOpened) {
      return (<><IconVer />Ver</>);
    }
    return (
      <>
        <IconResponder />
        Responder
      </>
    );
  };

  return (
    <div
      className={`chat-item ${disabled ? 'disabled' : ''} ${chat.anonReplied ? 'new-reply' : ''} ${!chat.isOpened ? 'unopened' : ''}`}
      onClick={() => !disabled && onOpenChat(chat.id)}
    >
      <div className="chat-item-main">
        <div className="chat-item-alias">
          {chat.anonAlias || "Anónimo"}

          {/* --- 👇 INDICADOR EN LÍNEA AÑADIDO 👇 --- */}
          {isOnline && <span className="online-indicator-dot"></span>}
          {/* --- 👆 FIN DEL INDICADOR 👆 --- */}

          {chat.anonReplied && <span className="new-reply-indicator">Nuevo mensaje</span>}
        </div>
        <div className="chat-item-content">
          {preview ? preview.content : "Chat iniciado, sin mensajes"}
        </div>
        <div className="chat-item-date">
          {preview
            ? new Date(preview.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : new Date(chat.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          }
        </div>
      </div>
      <button className="chat-item-button" disabled={disabled}>
        {getButtonContent()}
      </button>
    </div>
  );
};

// --- Icono de Fantasma (sin cambios) ---
const EmptyInboxIcon = () => ( /* ... */ );

// --- COMPONENTE PRINCIPAL MessageList (MODIFICADO) ---
export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livesLeft, setLivesLeft] = useState(null);
  const [minutesNext, setMinutesNext] = useState(null);
  const [error, setError] = useState(null);
  
  // --- 👇 NUEVO ESTADO PARA LOS ANÓNIMOS 👇 ---
  const [anonStatuses, setAnonStatuses] = useState({});
  // --- 👆 FIN NUEVO ESTADO 👆 ---

  const router = useRouter();
  const wsRef = useRef(null);

  const getAuthHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${localStorage.getItem("token")}` };
  const handleAuthFailure = () => { localStorage.clear(); router.push("/login?session=expired"); };

  // --- fetchData (sin cambios) ---
  const fetchData = async (token) => { /* ... (sin cambios) ... */
    if (!dashboardId) return;
    try {
      const headers = getAuthHeaders(token);
      const [meRes, chatsRes] = await Promise.all([
        fetch(`${API}/creators/me`, { headers, cache: 'no-store' }),
        fetch(`${API}/dashboard/${dashboardId}/chats`, { headers, cache: 'no-store' })
      ]);

      if (meRes.status === 401 || chatsRes.status === 401) {
        const newToken = await refreshToken(localStorage.getItem("publicId"));
        if (newToken) { fetchData(newToken); } else { handleAuthFailure(); }
        return;
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setLivesLeft(meData.lives);
        setMinutesNext(meData.minutesToNextLife);
      }
      if (chatsRes.ok) {
        const data = await chatsRes.json();
        setChats(data);
      } else {
        throw new Error("Error cargando chats");
      }
    } catch (err) {
      console.error("Error en fetchData:", err);
      setError("⚠️ Error al cargar tus chats. Intenta refrescar la página.");
    } finally {
      setLoading(false);
    }
  };

  // --- handleOpenChat (sin cambios) ---
  const handleOpenChat = async (chatId) => { /* ... (sin cambios) ... */
    try {
      const res = await fetch(`${API}/dashboard/${dashboardId}/chats/${chatId}/open`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo abrir el chat");
        if (data.livesLeft !== undefined) setLivesLeft(data.livesLeft);
        if (data.minutesToNextLife !== undefined) setMinutesNext(data.minutesToNextLife);
        return;
      }
      router.push(`/dashboard/${dashboardId}/chats/${chatId}`);
    } catch (err) {
      console.error("Error al abrir chat:", err);
      alert("⚠️ Error de red al intentar abrir el chat.");
    }
  };

  // --- useEffect (MODIFICADO para WebSocket) ---
  useEffect(() => {
    fetchData();

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No hay token para la conexión WS, abortando.");
      return;
    }

    const wsUrl = `${API.replace(/^http/, "ws")}/ws?dashboardId=${dashboardId}&token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // --- 👇 MANEJADOR DE WEBSOCKET MODIFICADO 👇 ---
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 1. Manejador de nuevos mensajes (sin cambios)
      if (data.type === 'new_message' || data.type === 'message') {
        fetchData(); // Recarga toda la lista y datos
      }

      // 2. NUEVO: Manejador de estado del anónimo
      if (data.type === 'ANON_STATUS_UPDATE') {
        console.log("WS (Dashboard) Status Update Recibido:", data);
        setAnonStatuses(prev => ({
          ...prev,
          [data.chatId]: data.status // 'online' o 'offline'
        }));
      }
    };
    // --- 👆 FIN DE MODIFICACIÓN 👆 ---

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId]);

  const animationStyle = (index) => ( /* ... (sin cambios) ... */ );

  return (
    <div>
      <h2 style={{ fontSize: '28px', color: '#fff', borderBottom: '1px solid var(--border-color-faint)', paddingBottom: '15px', marginBottom: '20px', fontWeight: 'bold' }}>
        Bandeja de Entrada
      </h2>
      {loading && <p style={{ textAlign: 'center' }}>Cargando chats...</p>}
      {error && <p style={{ color: "#FE3C72", textAlign: 'center' }}>{error}</p>}

      {!loading && chats.length === 0 && (
        <div className="empty-inbox-container fade-in-up" style={{ animationDelay: '0.5s' }}>
          <EmptyInboxIcon />
          <p className="empty-inbox-title">Tu espacio secreto está silencioso</p>
          <p className="empty-inbox-subtitle">¡Comparte tu link público para que la conversación comience!</p>
        </div>
      )}

      {!loading && chats.length > 0 && (
        <div>
          {chats.map((c, i) => (
            <div key={c.id} style={animationStyle(i)}>
              <ChatItem
                chat={c}
                onOpenChat={handleOpenChat}
                disabled={!c.isOpened && livesLeft === 0}
                minutesNext={minutesNext}
                // --- 👇 PASA LA PROP DE ESTADO 👇 ---
                isOnline={anonStatuses[c.id] === 'online'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}