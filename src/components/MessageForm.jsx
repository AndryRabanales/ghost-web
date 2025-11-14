"use client";
// --- 👇 1. AÑADE 'useState' 👇 ---
import { useState } from "react";
import { refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
// --- 👇 2. SUBE EL MÍNIMO A 40 👇 ---
const MIN_RESPONSE_LENGTH = 40; 

export default function MessageForm({
  dashboardId,
  chatId,
  onMessageSent,
  lastAnonQuestion // <--- 3. AÑADE LA NUEVA PROP
}) {
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  // --- 👇 4. AÑADE EL ESTADO DE ERROR 👇 ---
  const [error, setError] = useState(null); 
  const charCount = newMsg.length;

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || loading || charCount < MIN_RESPONSE_LENGTH) return;
    
    setLoading(true);
    setError(null); // <--- 5. Limpia errores antiguos

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

      // --- 👇 6. MANEJO DE ERROR MEJORADO 👇 ---
      if (!res.ok) {
        // Si el backend nos da un 400 (baja calidad), capturamos el JSON
        const errorData = await res.json();
        throw new Error(errorData.error || "Error enviando mensaje");
      }

      const msgData = await res.json();
      setNewMsg("");
      if (onMessageSent) onMessageSent(msgData);
    } catch (err) {
      console.error("Error en handleSend:", err);
      // ¡Aquí está la magia! Mostramos el error de la IA al creador
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
      
      {/* --- 👇 7. SECCIÓN DE CONTEXTO Y ERRORES AÑADIDA 👇 --- */}
      
      {/* Aviso de error de la IA (si existe) */}
      {error && (
        <div style={{
          fontSize: '13px',
          color: '#ff7b7b', // Color rojo error
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

      {/* Guía de contexto (la pregunta del anónimo) */}
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
      
      {/* Contador de caracteres (se muestra si no hay error) */}
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
      {/* --- 👆 FIN DE SECCIÓN AÑADIDA 👆 --- */}
    </>
  );
}