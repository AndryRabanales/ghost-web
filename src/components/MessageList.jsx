// src/components/MessageList.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Iconos para Botones de Chat ---
const IconResponder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconVer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEspera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

// --- SUBCOMPONENTE ChatItem (CON CORRECCIÓN DE ESPACIOS) ---
const ChatItem = ({ chat, onOpenChat, disabled, minutesNext }) => {
  const preview = chat.previewMessage;

  // Determina el contenido del botón
  const getButtonContent = () => {
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
      return (<><IconVer />Ver</>); // ⬅️ CORRECCIÓN APLICADA AQUÍ: Compactado en una sola línea
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
      // 💡 CAMBIO CLAVE 2: Clase condicional para el estilo de notificación
      className={`chat-item ${disabled ? 'disabled' : ''} ${chat.anonReplied ? 'new-reply' : ''} ${!chat.isOpened && !chat.anonReplied ? 'unopened' : ''}`}
      onClick={() => !disabled && onOpenChat(chat.id)}
    >
      <div className="chat-item-main">
        <div className="chat-item-alias">
          {/* Esto sigue usando el alias del chat, está bien */}
          {chat.anonAlias || "Anónimo"}
          {/* 💡 CAMBIO CLAVE 3: Muestra el indicador de texto */}
          {chat.anonReplied && <span className="new-reply-indicator">Nuevo mensaje</span>}
        </div>
        <div className="chat-item-content">
          {/* Usa 'preview.content' */}
          {preview ? preview.content : "Chat iniciado, sin mensajes"}
        </div>
        <div className="chat-item-date">
          {/* Usa 'preview.createdAt' o la fecha de creación del chat */}
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

// ... (Resto del componente MessageList)
// --- Icono de Fantasma para la bandeja vacía (SIN CAMBIOS) ---
const EmptyInboxIcon = () => (
  <svg className="empty-inbox-icon" width="64" height="64" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.29241 12.7238C4.24584 10.2965 5.06019 7.40698 7.12053 5.61865C9.18087 3.83032 12.0673 3.36383 14.545 4.39088C17.0227 5.41793 18.6739 7.74542 18.7198 10.4387C18.7656 13.1319 17.2023 15.5168 14.809 16.67L15 18H9C6.46667 18 5 19.4667 5 22H19V21.5C18.0253 20.5222 17.5025 19.2433 17.5 17.9142C17.5 16.5 18 15 19 14C19 14 19 11 17 10C15 9 14 10 14 10C14 10 13 8 11 9C9 10 8 12 8 12C6.89543 12 6 12.8954 6 14C6 15.1046 6.89543 16 8 16H9.1909C6.79773 14.8432 5.23444 12.4583 5.29241 9.76506C5.35038 7.07183 6.97728 4.74433 9.45498 3.71728C11.9327 2.69023 14.8191 3.15672 16.8795 4.94505C18.9398 6.73338 19.7542 9.62291 18.7076 12.0502" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export default function MessageList({ dashboardId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livesLeft, setLivesLeft] = useState(null);
  const [minutesNext, setMinutesNext] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const wsRef = useRef(null);

  const getAuthHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${localStorage.getItem("token")}` };
  const handleAuthFailure = () => { localStorage.clear(); router.push("/login?session=expired"); };

  const fetchData = async (token) => {
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

  // ==================
  // ESTA ES LA FUNCIÓN DE CLICK ORIGINAL Y CORRECTA
  // ==================
  const handleOpenChat = async (chatId) => {
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
      // Esto te lleva a la página del chat, que es lo que quieres
      router.push(`/dashboard/${dashboardId}/chats/${chatId}`);
    } catch (err) {
      console.error("Error al abrir chat:", err);
      alert("⚠️ Error de red al intentar abrir el chat.");
    }
  };

  useEffect(() => {
    fetchData();

    // ==================
    // ARREGLO 1: AÑADIR EL TOKEN (Esto ya estaba)
    // ==================
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No hay token para la conexión WS, abortando.");
      return;
    }

    const wsUrl = `${API.replace(/^http/, "ws")}/ws?dashboardId=${dashboardId}&token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // ==================
    // ARREGLO 2: ESCUCHAR AMBOS TIPOS DE MENSAJE (Esto ya estaba)
    // ==================
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'new_message' || data.type === 'message') {
        fetchData(); // Esto recarga la lista, como querías.
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId]);

  const animationStyle = (index) => ({
    animation: `fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
    animationDelay: `${0.1 * index}s`,
    opacity: 0,
  });

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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}