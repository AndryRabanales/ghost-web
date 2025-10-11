// src/components/MessageList.jsx
"use client";
import { useEffect, useState } from "react";
import { refreshToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

const ChatItem = ({ chat, onOpenChat, disabled, minutesNext }) => {
  const [isHovered, setIsHovered] = useState(false);
  const last = chat.lastMessage;

  const cardStyle = {
    display: 'flex', alignItems: 'center', padding: '20px 25px',
    background: isHovered ? '#2C2C2E' : '#1E1E1E',
    border: '1px solid #38383a', borderRadius: '18px',
    marginBottom: '15px', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.25s ease, box-shadow 0.25s ease',
    transform: isHovered ? 'scale(1.03) translateZ(0)' : 'scale(1) translateZ(0)',
    boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
  };

  const buttonStyle = {
    padding: "10px 18px",
    background: disabled ? "#555" : 'linear-gradient(90deg, #FF655B, #FE3C72)',
    color: "#fff", borderRadius: '12px', fontSize: 14, fontWeight: 'bold',
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: 'nowrap', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    boxShadow: isHovered ? `0 6px 18px rgba(254, 60, 114, 0.4)` : 'none'
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !disabled && onOpenChat(chat.id)}
    >
      <div style={{ flexGrow: 1, marginRight: '20px', overflow: 'hidden' }}>
        <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: 6, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {chat.anonAlias || "Anónimo"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", marginBottom: 8, fontSize: '14px', fontStyle: last ? 'normal' : 'italic', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {last ? `${last.from === 'creator' ? 'Tú: ' : ''}${last.content}` : "Chat iniciado, sin mensajes"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {last ? new Date(last.createdAt).toLocaleString() : new Date(chat.createdAt).toLocaleString()}
        </div>
      </div>
      <button style={buttonStyle} disabled={disabled}>
        {chat.isOpened ? "Ver Chat" : (disabled ? `Espera ${minutesNext}m` : "Responder")}
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