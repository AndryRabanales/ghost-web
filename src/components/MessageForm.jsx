"use client";
import { useState } from "react";
import { refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function MessageForm({
  dashboardId,
  chatId,
  onMessageSent,
  // --- MODIFICADO: Props eliminadas ---
  // livesLeft, (ya no se necesita)
  // minutesToNextLife, (ya no se necesita)
}) {
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    // --- MODIFICADO: Lógica de 'disabled' simplificada ---
    if (!newMsg.trim() || loading) return;
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

  // --- MODIFICADO: 'isDisabled' ya no depende de las vidas ---
  const isDisabled = loading;

  return (
    <>
      <form onSubmit={handleSend} className="chat-reply-form">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe una respuesta..."
          className="form-input-field reply-input"
          disabled={isDisabled} // Ahora solo se deshabilita al cargar
        />
        <button
          type="submit"
          className="submit-button reply-button"
          // --- MODIFICADO: 'disabled' ya no depende de las vidas ---
          disabled={isDisabled || !newMsg.trim()}
        >
          {/* --- MODIFICADO: Texto del botón simplificado --- */}
          {loading ? "..." : "Enviar"}
        </button>
      </form>

      {/* --- ELIMINADO: Mensaje de "Sin vidas" --- */}
      {/* Ya no se muestra el contador de minutos */}
    </>
  );
}