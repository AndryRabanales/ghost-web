// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// Modificamos las props para recibir onFirstSent
export default function AnonMessageForm({ publicId, onSent, onFirstSent }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  // Nuevo estado para guardar la info del último chat enviado con éxito
  const [lastSentChatInfo, setLastSentChatInfo] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      setLastSentChatInfo(null); // Limpiar en caso de error
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    setLastSentChatInfo(null); // Limpiar antes de enviar

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando el mensaje");

      setStatus("success");
      // Guardamos la info del chat recién creado
      setLastSentChatInfo(data);

      if (data.chatId && data.anonToken) {
        const myChats = JSON.parse(localStorage.getItem("myChats") || "[]");
        const isFirstChatForCreator = !myChats.some(chat => chat.creatorPublicId === publicId);

        const newChatEntry = {
          chatId: data.chatId,
          anonToken: data.anonToken,
          creatorPublicId: publicId,
          preview: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          ts: new Date().toISOString(),
          creatorName: data.creatorName || "Conversación", // Usar el nombre del creador si viene
          anonAlias: alias || "Anónimo",
          hasNewReply: false, // <-- AÑADIDO: Inicialmente no hay respuesta nueva
        };

        const updatedChats = [newChatEntry, ...myChats];
        localStorage.setItem("myChats", JSON.stringify(updatedChats));

        // Notificar si fue el primer chat para este creador
        if (isFirstChatForCreator && typeof onFirstSent === "function") {
          onFirstSent();
        }
      }

      setContent(""); // Limpiar contenido solo en éxito
      setCharCount(0); // Resetear contador solo en éxito
      if (typeof onSent === "function") onSent(); // Notificar que se envió (para recargar lista)

    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
    // No limpiamos 'content' aquí en caso de error para que el usuario pueda reintentar
  };

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      <form onSubmit={handleSubmit} className="form-element-group">
        {/* ... (input de alias y textarea sin cambios) ... */}
        <input
            type="text"
            placeholder="Tu alias (opcional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="form-input-field"
          />
          <textarea
            placeholder="Escribe tu mensaje anónimo..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setCharCount(e.target.value.length);
            }}
            className="form-input-field"
            rows="4"
            maxLength="500"
          ></textarea>

          <div className="char-counter">
            {charCount} / 500
          </div>
        <button type="submit" disabled={status === "loading" || !content.trim()} className="submit-button">
          {status === "loading" ? "Enviando..." : "Enviar Mensaje"}
        </button>
      </form>

       {/* Mensaje de éxito modificado */}
       {status === "success" && lastSentChatInfo && (
        <div className="form-status-message success">
           <p>✅ ¡Mensaje enviado!</p>
           <p className="sub-text">
            Puedes ver tu chat y la respuesta (cuando llegue) más abajo o <a href={`/chats/${lastSentChatInfo.anonToken}/${lastSentChatInfo.chatId}`}>abrirlo aquí</a>.
           </p>
        </div>
      )}

      {status === "error" && (
        <div className="form-status-message error">
          <p>{errorMsg || "Hubo un error al enviar tu mensaje."}</p>
        </div>
      )}
    </div>
  );
}