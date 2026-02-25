// src/components/AnonMessageForm.jsx
"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

export default function AnonMessageForm({
  publicId,
  onChatCreated,
  creatorName
}) {
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!content.trim()) {
      setErrorMsg("Escribe un mensaje válido.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: alias.trim() ? alias.trim() : "Anónimo",
          content
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el mensaje");

      // Guardar en localStorage (Solo 1 chat activo a la vez para mantener el anonimato total)
      try {
        const newChat = {
          chatId: data.chatId,
          anonToken: data.anonToken,
          anonAlias: alias.trim() ? alias.trim() : "Anónimo",
          creatorName: creatorName || "Creador",
          hasNewReply: false,
          timestamp: new Date().toISOString()
        };
        // Sobreescribe todo, eliminando cualquier chat/historial viejo que pudiera existir.
        localStorage.setItem("myChats", JSON.stringify([newChat]));
      } catch (e) {
        console.error("Error guardando chat en myChats:", e);
      }

      setContent("");
      setAlias("");
      setCharCount(0);

      if (onChatCreated) {
        onChatCreated(data);
      } else {
        setStatus("success");
      }

    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const isDisabled = status === "loading" || !content.trim();

  let buttonText = status === "loading" ? "Enviando..." : "Enviar Mensaje";

  const placeholderText = "Dime que piensas de mi";

  return (
    <div className="anon-form-container mounted">

      {status === "success" ? (
        <div style={{
          background: 'rgba(0, 255, 128, 0.08)',
          border: '1px solid rgba(0, 255, 128, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: '#00ff80'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
          <strong>¡Mensaje enviado!</strong>
          <p style={{ color: 'rgba(235,235,245,0.6)', fontSize: '14px', marginTop: '8px' }}>
            Te avisaremos por email cuando haya una respuesta.
          </p>
          <button
            onClick={() => setStatus("idle")}
            style={{
              marginTop: '15px', background: 'rgba(0,255,128,0.1)',
              border: '1px solid rgba(0,255,128,0.3)', color: '#00ff80',
              padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
            }}
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-element-group">

          <input
            type="text"
            placeholder="Tu alias (opcional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="form-input-field"
            style={{
              width: '100%',
              padding: '12px 15px',
              fontSize: '16px',
              marginBottom: '12px',
              boxSizing: 'border-box'
            }}
            maxLength="30"
          />
          <textarea
            placeholder={placeholderText}
            value={content}
            onChange={(e) => { setContent(e.target.value); setCharCount(e.target.value.length); }}
            className="form-input-field"
            rows="4"
            maxLength="500"
            style={{ fontSize: '16px', padding: '15px', boxSizing: 'border-box', width: '100%' }}
          ></textarea>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: '8px',
            marginBottom: '10px'
          }}>
            <div className="char-counter">{charCount} / 500</div>
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="submit-button"
            style={{
              marginTop: '10px',
              background: 'linear-gradient(90deg, #8e2de2, #4a00e0)',
              cursor: 'pointer'
            }}
          >
            {buttonText}
          </button>
        </form>
      )}

      {status === "error" && (
        <div className="form-status-message error"><p>{errorMsg}</p></div>
      )}
    </div>
  );
}