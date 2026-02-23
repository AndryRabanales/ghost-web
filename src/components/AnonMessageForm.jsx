// src/components/AnonMessageForm.jsx
"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- COMPONENTE DE ACTIVIDAD ---
const ActivityIndicator = ({ remaining }) => {
  const isLow = remaining <= 5;
  const color = isLow ? '#ffc107' : 'var(--success-solid)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      marginBottom: '20px', fontSize: '14px', color: color, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>
      <span style={{
        width: '10px', height: '10px', backgroundColor: color,
        borderRadius: '50%', boxShadow: `0 0 10px ${color}`,
        animation: 'pulse-indicator 1.5s infinite'
      }}></span>
      {remaining > 0
        ? `⚡ Cupos restantes hoy: ${remaining}`
        : `⛔ Cupos agotados por hoy`
      }
    </div>
  );
};

export default function AnonMessageForm({
  publicId, topicPreference, isFull, escasezData
}) {
  const [content, setContent] = useState("");
  const [fanEmail, setFanEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);

  // Cupos restantes
  const limit = escasezData?.dailyMsgLimit || 30;
  const count = escasezData?.msgCountToday || 0;
  const remaining = Math.max(0, limit - count);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (isFull) {
      setErrorMsg("Los cupos se han agotado por hoy.");
      setStatus("error");
      return;
    }

    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("Escribe un mensaje válido (mínimo 3 caracteres).");
      setStatus("error");
      return;
    }

    if (!fanEmail.includes('@')) {
      setErrorMsg("Necesitas un email válido para recibir la respuesta.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: "Anónimo",
          content,
          fanEmail
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el mensaje");

      setStatus("success");
      setContent("");
      setFanEmail("");
      setCharCount(0);

    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const isDisabled = status === "loading" || !content.trim() || isFull;

  let buttonText;
  if (status === "loading") {
    buttonText = "Enviando...";
  } else if (isFull) {
    buttonText = "Agotado (Vuelve Mañana)";
  } else {
    buttonText = "Enviar Mensaje";
  }

  const placeholderText = topicPreference ? `Tema sugerido: "${topicPreference}"...` : "Escribe tu mensaje aquí...";

  return (
    <div className="anon-form-container mounted">

      {isFull ? (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid #ffc107',
          color: '#ffc107',
          padding: '15px',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          ⛔ Cupo diario lleno. Vuelve mañana.
        </div>
      ) : (
        <ActivityIndicator remaining={remaining} />
      )}

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

          <textarea
            placeholder={placeholderText}
            value={content}
            onChange={(e) => { setContent(e.target.value); setCharCount(e.target.value.length); }}
            className="form-input-field"
            rows="4"
            maxLength="500"
            style={{ fontSize: '16px', padding: '15px' }}
            disabled={isFull}
          ></textarea>
          <div className="char-counter">{charCount} / 500</div>

          {/* INPUT DE EMAIL */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Tu email (Para avisarte cuando responda)"
              value={fanEmail}
              onChange={(e) => setFanEmail(e.target.value)}
              className="form-input-field"
              style={{ fontSize: '14px' }}
              disabled={isFull}
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="submit-button"
            style={{
              marginTop: '10px',
              background: isFull ? '#3a3a4a' : 'linear-gradient(90deg, #8e2de2, #4a00e0)',
              cursor: isFull ? 'not-allowed' : 'pointer'
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