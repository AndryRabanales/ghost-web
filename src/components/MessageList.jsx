// src/components/MessageList.jsx
"use client";
import { useEffect, useState } from "react";
import { refreshToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- SUBCOMPONENTE ChatItem MODIFICADO ---
// Se han reemplazado los estilos en línea por `className` para un mejor control en CSS.
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

export default function MessageList({ dashboardId }) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [livesLeft, setLivesLeft] = useState(null);
    const [minutesNext, setMinutesNext] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();

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
        const interval = setInterval(() => fetchData(), 15000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboardId]);

    const animationStyle = (index) => ({
        animation: `fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
        animationDelay: `${0.1 * index}s`,
        opacity: 0,
    });

    return (
        <div>
            <h2 style={{ fontSize: '28px', color: '#fff', borderBottom: '1px solid #38383a', paddingBottom: '15px', marginBottom: '30px', fontWeight: 'bold' }}>
              Bandeja de Entrada
            </h2>
            {loading && <p style={{ textAlign: 'center' }}>Cargando chats...</p>}
            {error && <p style={{ color: "#FE3C72", textAlign: 'center' }}>{error}</p>}
            
            {!loading && chats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1E1E1E', borderRadius: '24px', border: '1px dashed #38383a' }}>
                    <div style={{fontSize: '56px', marginBottom: '20px', opacity: 0.5, filter: 'grayscale(80%)'}}>🤫</div>
                    <p style={{ margin: 0, fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>Tu espacio secreto está silencioso por ahora.</p>
                    <p style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>¡Comparte tu link público para que la conversación comience!</p>
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