"use client";
import { useState } from "react";
import { refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function MessageForm({
  dashboardId,
  chatId,
  onMessageSent,
  livesLeft,
  minutesToNextLife,
}) {
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || livesLeft === 0 || loading) return;
    setLoading(true);

    try {
      let res = await fetch(
        `${API}/dashboard/${dashboardId}/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ content: newMsg }),
        }
      );
      
      if (res.status === 401) {
          const newToken = await refreshToken(localStorage.getItem("publicId"));
          if(newToken) {
              res = await fetch(
                `${API}/dashboard/${dashboardId}/chats/${chatId}/messages`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getAuthHeaders(newToken) },
                  body: JSON.stringify({ content: newMsg }),
                }
              );
          }
      }

      if (!res.ok) throw new Error("Error enviando mensaje");

      const msgData = await res.json();
      setNewMsg("");
      if (onMessageSent) onMessageSent(msgData);
    } catch (err) {
      console.error("Error en handleSend:", err);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = livesLeft === 0 || loading;

  return (
    <>
      <form onSubmit={handleSend} className="chat-reply-form">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe una respuesta..."
          className="form-input-field reply-input"
          disabled={isDisabled}
        />
        <button
          type="submit"
          className="submit-button reply-button"
          disabled={isDisabled || !newMsg.trim()}
        >
          {loading ? "..." : (livesLeft === 0 ? "Sin vidas" : "Enviar")}
        </button>
      </form>

      {livesLeft === 0 && (
        <p style={{ marginTop: 12, color: "var(--glow-accent-crimson)", fontSize: 14, textAlign: 'center' }}>
          ⏳ Espera {minutesToNextLife} min para recuperar una vida, o suscríbete Premium para tener vidas ilimitadas.
        </p>
      )}
    </>
  );
}