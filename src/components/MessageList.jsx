// src/components/MessageList.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import { refreshToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- SUBCOMPONENTE ChatItem ---
const ChatItem = ({ chat, onOpenChat, disabled, minutesNext }) => {
  const last = chat.lastMessage;

  return (
    <div 
      className={`chat-item ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onOpenChat(chat.id)}
    >
      <div className="chat-item-main">
        <div className="chat-item-alias">
          {chat.anonAlias || "Anónimo"}
        </div>
        <div className="chat-item-content">
          {last ? `${last.from === 'creator' ? 'Tú: ' : ''}${last.content}` : "Chat iniciado, sin mensajes"}
        </div>
        <div className="chat-item-date">
          {last ? new Date(last.createdAt).toLocaleString() : new Date(chat.createdAt).toLocaleString()}
        </div>
      </div>
      <button className="chat-item-button" disabled={disabled}>
        {chat.isOpened ? "Ver" : (disabled ? `Espera` : "Responder")}
      </button>
    </div>
  );
};

// --- Icono de Fantasma para la bandeja vacía ---
const EmptyInboxIcon = () => (
    <svg className="empty-inbox-icon" width="64" height="64" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.29241 12.7238C4.24584 10.2965 5.06019 7.40698 7.12053 5.61865C9.18087 3.83032 12.0673 3.36383 14.545 4.39088C17.0227 5.41793 18.6739 7.74542 18.7198 10.4387C18.7656 13.1319 17.2023 15.5168 14.809 16.67L15 18H9C6.46667 18 5 19.4667 5 22H19V21.5C18.0253 20.5222 17.5025 19.2433 17.5 17.9142C17.5 16.5 18 15 19 14C19 14 19 11 17 10C15 9 14 10 14 10C14 10 13 8 11 9C9 10 8 12 8 12C6.89543 12 6 12.8954 6 14C6 15.1046 6.89543 16 8 16H9.1909C6.79773 14.8432 5.23444 12.4583 5.29241 9.76506C5.35038 7.07183 6.97728 4.74433 9.45498 3.71728C11.9327 2.69023 14.8191 3.15672 16.8795 4.94505C18.9398 6.73338 19.7542 9.62291 18.7076 12.0502" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
            router.push(`/dashboard/${dashboardId}/chats/${chatId}`);
        } catch (err) {
            console.error("Error al abrir chat:", err);
            alert("⚠️ Error de red al intentar abrir el chat.");
        }
    };

    useEffect(() => {
        fetchData();

        const wsUrl = `${API.replace(/^http/, "ws")}/ws?dashboardId=${dashboardId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
                fetchData();
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