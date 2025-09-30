"use client";
import { useState } from "react";
import { refreshToken } from "@/utils/auth"; // 👈 importamos el helper

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ dashboardId, chatId, onMessageSent }) {
  const [newMsg, setNewMsg] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

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

      // 👇 Si el token expiró
      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId"); // ⚠️ asegúrate de guardarlo al crear el dashboard
        const newToken = await refreshToken(publicId);
        if (newToken) {
          res = await fetch(
            `${API}/dashboard/${dashboardId}/chats/${chatId}/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ content: newMsg }),
            }
          );
        } else {
          console.error("No se pudo renovar el token al enviar mensaje");
          return;
        }
      }

      if (!res.ok) {
        console.error("⚠️ Error enviando mensaje:", res.status);
        return;
      }

      setNewMsg("");
      if (onMessageSent) onMessageSent(); // 🔁 refrescar lista si padre lo pide
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
      />
      <button type="submit" style={{ marginTop: 8 }}>
        Enviar
      </button>
    </form>
  );
}
