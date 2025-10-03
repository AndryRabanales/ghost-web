"use client";
import { useState } from "react";
import { refreshToken } from "@/utils/auth"; // 👈 sigue igual

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function MessageForm({
  dashboardId,
  chatId,
  onMessageSent,
  livesLeft,           // 👈 nuevas props
  minutesToNextLife,   // 👈 nuevas props
}) {
  const [newMsg, setNewMsg] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || livesLeft === 0) return;
  
    try {
      let res = await fetch(
        `${API}/dashboard/${dashboardId}/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ content: newMsg }),
        }
      );
  
      if (!res.ok) {
        console.error("⚠️ Error enviando mensaje:", res.status);
        return;
      }
  
      const msgData = await res.json(); // 👈 el backend ya devuelve el mensaje creado
      setNewMsg("");
  
      // 🔥 pasar mensaje nuevo al padre (ChatPage)
      if (onMessageSent) onMessageSent(msgData);
    } catch (err) {
      console.error("Error en handleSend:", err);
    }
  };
  

  return (
    <form onSubmit={handleSend} style={{ marginTop: 10 }}>
      <input
        type="text"
        value={newMsg}
        onChange={(e) => setNewMsg(e.target.value)}
        placeholder="Escribe tu respuesta…"
        style={{ width: "100%", padding: 10 }}
        disabled={livesLeft === 0} // 🛑 bloquea input
      />
      <button
        type="submit"
        style={{ marginTop: 8 }}
        disabled={livesLeft === 0} // 🛑 bloquea botón
      >
        {livesLeft === 0 ? "Sin vidas" : "Enviar"}
      </button>

      {livesLeft === 0 && (
        <p style={{ marginTop: 6, color: "red", fontSize: 14 }}>
          ⏳ Espera {minutesToNextLife} min para recuperar una vida,
          o suscríbete Premium ❤️
        </p>
      )}
    </form>
  );
}
