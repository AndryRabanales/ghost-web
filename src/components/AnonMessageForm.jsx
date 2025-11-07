// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// MODIFICADO: Cambiadas las props
export default function AnonMessageForm({ publicId, onChatCreated }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  // ELIMINADO: lastSentChatInfo ya no es necesario aquí

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
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando el mensaje");

      setStatus("success");

      if (data.chatId && data.anonToken) {
        // --- MODIFICADO: Lógica de guardado ---
        // Ahora solo guardamos UN chat por creatorPublicId.
        
        const myChats = JSON.parse(localStorage.getItem("myChats") || "[]");
        
        // Filtra cualquier chat *anterior* con este mismo creador
        const otherChats = myChats.filter(chat => chat.creatorPublicId !== publicId);

        const newChatEntry = {
          chatId: data.chatId,
          anonToken: data.anonToken,
          creatorPublicId: publicId,
          preview: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          ts: new Date().toISOString(),
          creatorName: data.creatorName || "Conversación",
          anonAlias: alias || "Anónimo",
          hasNewReply: false, 
          previewFrom: 'anon' 
        };

        // Añade el nuevo chat al principio de la lista filtrada
        const updatedChats = [newChatEntry, ...otherChats];
        localStorage.setItem("myChats", JSON.stringify(updatedChats));

        // --- MODIFICADO: Llama al nuevo callback ---
        // Pasa la información del chat recién creado al componente padre
        if (typeof onChatCreated === "function") {
          onChatCreated(newChatEntry);
        }
      }

      // NO limpiamos el contenido aquí, el componente se va a desmontar
      // setContent(""); 
      // setCharCount(0); 

    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      <form onSubmit={handleSubmit} className="form-element-group">
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

      {status === "error" && (
        <div className="form-status-message error">
          <p>{errorMsg || "Hubo un error al enviar tu mensaje."}</p>
        </div>
      )}
    </div>
  );
}