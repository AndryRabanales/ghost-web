// src/components/MessageForm.jsx
"use client";
// --- 1. 'useState' ya estaba importado ---
import { useState } from "react";
import { refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MIN_RESPONSE_LENGTH = 40; 

export default function MessageForm({
  dashboardId,
  chatId,
  onMessageSent,
  lastAnonQuestion 
}) {
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 
  const charCount = newMsg.length;

  // --- 2. CREA UNA INSTANCIA DE AUDIO (reutilizable) ---
  // Usamos useState para asegurarnos de que solo se cree una vez en el cliente.
  const [chachingSound, setChachingSound] = useState(null);
  
  useState(() => {
    // Esto solo se ejecutará en el cliente (client-side)
    if (typeof Audio !== "undefined") {
      setChachingSound(new Audio('/chaching.mp3'));
    }
  }, []);
  // --- FIN DE MODIFICACIÓN 2 ---

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || loading || charCount < MIN_RESPONSE_LENGTH) return;
    
    setLoading(true);
    setError(null); 

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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error enviando mensaje");
      }

      const msgData = await res.json();

      // --- 👇 3. REPRODUCE EL SONIDO AQUÍ 👇 ---
      if (chachingSound) {
        chachingSound.currentTime = 0; // Reinicia el sonido si se usa rápido
        chachingSound.play().catch(err => {
          console.warn("No se pudo reproducir el sonido 'cha-ching':", err);
        });
      }
      // --- 👆 FIN DE MODIFICACIÓN 3 👆 ---

      setNewMsg("");
      if (onMessageSent) onMessageSent(msgData);
    } catch (err) {
      console.error("Error en handleSend:", err);
      setError(err.message); 
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || charCount < MIN_RESPONSE_LENGTH;

  return (
    <>
      <form onSubmit={handleSend} className="chat-reply-form">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe una respuesta..."
          className="form-input-field reply-input"
          disabled={loading} 
        />
        <button
          type="submit"
          className="submit-button reply-button"
          disabled={isDisabled || !newMsg.trim()}
        >
          {loading ? "..." : "Enviar"}
        </button>
      </form>
      
      {/* --- (El resto del componente de error y guía no cambia) --- */}
      {error && (
        <div style={{
          fontSize: '13px',
          color: '#ff7b7b', 
          textAlign: 'center',
          fontWeight: '600',
          marginTop: '10px',
          padding: '8px',
          background: 'rgba(255, 123, 123, 0.1)',
          borderRadius: '8px',
          border: '1px solid #ff7b7b'
        }}>
          {error}
        </div>
      )}

      {lastAnonQuestion && !error && (
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginTop: '10px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid var(--border-color-faint)',
          fontStyle: 'italic'
        }}>
          Respondiendo a: "{lastAnonQuestion.length > 80 ? lastAnonQuestion.substring(0, 80) + '...' : lastAnonQuestion}"
        </div>
      )}
      
      {!error && (
        <div style={{
            fontSize: '12px',
            color: charCount < MIN_RESPONSE_LENGTH ? '#ff7b7b' : 'var(--text-secondary)',
            textAlign: 'right',
            marginTop: '8px'
        }}>
            {charCount} / {MIN_RESPONSE_LENGTH} caracteres (Mínimo para garantizar calidad)
        </div>
      )}
    </>
  );
}