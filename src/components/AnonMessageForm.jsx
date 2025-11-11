// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- INICIO: NUEVO COMPONENTE INTERNO ---
/**
 * Un componente simple para seleccionar montos de propina (simulados)
 */
const TipSelector = ({ selectedAmount, onSelect }) => {
  const tipOptions = [100, 200, 500];
  const MIN_AMOUNT = 100; // <-- AÑADIDO: Mínimo para el premium

  // Estilo base del botón de propina
  const buttonStyle = (amount) => ({
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    // Cambia el estilo si está seleccionado
    color: selectedAmount === amount ? '#fff' : 'var(--glow-accent-crimson, #c9a4ff)',
    background: selectedAmount === amount ? 'linear-gradient(90deg, #8e2de2, #4a00e0)' : 'rgba(255, 255, 255, 0.05)',
    border: selectedAmount === amount ? '1px solid #8e2de2' : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  // Estilo del contenedor de botones
  const containerStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    margin: '15px 0 5px 0' // Espacio entre el contador y el botón de envío
  };

  const labelStyle = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
    textAlign: 'center'
  };

  return (
    <div>
      {/* MODIFICADO: Texto para reflejar el modelo premium */}
      <p style={labelStyle}>Monto por Respuesta Premium (Mínimo ${MIN_AMOUNT} MXN)</p> 
      <div style={containerStyle}>
        {tipOptions.map((amount) => (
          <button
            key={amount}
            type="button"
            style={buttonStyle(amount)}
            onClick={() => onSelect(selectedAmount === amount ? 0 : amount)} 
          >
            ${amount} MXN
          </button>
        ))}
      </div>
      {/* AÑADIDO: Aviso si no ha seleccionado una propina */}
      {selectedAmount === 0 && <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', opacity: 0.7, textAlign: 'center'}}>
          (El mensaje se enviará sin garantía de respuesta)
      </p>}
    </div>
  );
};
// --- FIN: NUEVO COMPONENTE INTERNO ---


export default function AnonMessageForm({ publicId, onChatCreated }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  
  // --- ESTADO AÑADIDO ---
  const [tipAmount, setTipAmount] = useState(0); 

  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const MIN_PREMIUM_AMOUNT = 100; // <-- AÑADIDO (P1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (validación de 3 caracteres se mantiene) ...
    
    // --- MODIFICACIÓN (P1): Validación de mínimo si selecciona un monto ---
    if (tipAmount > 0 && tipAmount < MIN_PREMIUM_AMOUNT) {
        setErrorMsg(`El monto mínimo por respuesta premium es $${MIN_PREMIUM_AMOUNT} MXN.`);
        setStatus("error");
        return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // --- MODIFICADO: Payload ahora incluye tipAmount ---
        body: JSON.stringify({ 
          alias, 
          content,
          tipAmount // <-- Aquí se envía la propina
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // --- MODIFICACIÓN (P1): Manejo de error de modo solo propina ---
        if (data.code === "TIP_ONLY_MODE") {
            // Este es el error del backend cuando el creador tiene activado el MODO SOLO PROPINAS
            throw new Error(`Este creador solo acepta mensajes con pago. El mínimo es $${MIN_PREMIUM_AMOUNT} MXN.`);
        }
        // --- FIN MODIFICACIÓN ---
        throw new Error(data.error || "Error enviando el mensaje");
      }

      setStatus("success");

      if (data.chatId && data.anonToken) {
        // ... (lógica de guardado en localStorage sin cambios) ...
        const myChats = JSON.parse(localStorage.getItem("myChats") || "[]");
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
        const updatedChats = [newChatEntry, ...otherChats];
        localStorage.setItem("myChats", JSON.stringify(updatedChats));

        if (typeof onChatCreated === "function") {
          onChatCreated(newChatEntry);
        }
      }
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
          
          {/* --- BLOQUE AÑADIDO --- */}
          <TipSelector 
            selectedAmount={tipAmount}
            onSelect={setTipAmount}
          />
          {/* --- FIN DEL BLOQUE --- */}

        <button type="submit" disabled={status === "loading" || !content.trim()} className="submit-button">
          {/* --- MODIFICADO: El texto del botón cambia si hay propina --- */}
          {status === "loading" ? "Enviando..." : (tipAmount > 0 ? `Enviar Mensaje +$${tipAmount}` : "Enviar Mensaje")}
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