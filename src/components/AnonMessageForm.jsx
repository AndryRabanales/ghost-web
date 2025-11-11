"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MIN_PREMIUM_AMOUNT = 100; // Mínimo para el premium

// --- CORRECCIÓN: FUNCIÓN MOVIDA AL NIVEL RAÍZ (ACCESIBLE) (S3) ---
const formatContract = (contractData) => {
    try {
        // Aseguramos que es un objeto (ya debería serlo si lo cargó bien el padre)
        const data = typeof contractData === 'string' ? JSON.parse(contractData) : contractData;
        
        // Manejo de valores no definidos si el contrato es nuevo o JSON vacío
        if (!data || Object.keys(data).length === 0) {
             // Devolver el contrato default si el JSON está vacío o es null
             return "Respuesta de alta calidad garantizada.";
        }
        
        let parts = [];
        if (data.include_photo) parts.push("1 Foto Exclusiva");
        if (data.text_min_chars > 0) parts.push(`Mínimo ${data.text_min_chars} caracteres de texto`);
        if (data.include_pdf) parts.push("1 Archivo PDF");
        
        return parts.length > 0 ? parts.join(', ') : "Respuesta de alta calidad garantizada.";
    } catch (e) {
        console.error("Error al parsear el contrato:", e);
        return "Respuesta de alta calidad garantizada.";
    }
}
// --- FIN: Función de Formato (S3) ---


// --- COMPONENTE TipSelector (Ahora ya no incluye la función) ---
/**
 * Un componente simple para seleccionar montos de propina (simulados)
 */
const TipSelector = ({ selectedAmount, onSelect }) => {
    const tipOptions = [100, 200, 500];
    const MIN_AMOUNT = 100;

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
// --- FIN: COMPONENTE TipSelector ---


export default function AnonMessageForm({ 
    publicId, 
    onChatCreated,
    escasezData, 
    isFull,
    creatorContract // <-- Ahora accesible
}) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [tipAmount, setTipAmount] = useState(0); 

  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  // MIN_PREMIUM_AMOUNT ya está definido arriba

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
    
  // S3: Generar texto del contrato para la vista del anónimo
  // Llama a la función ahora que está en el scope correcto
  const contractSummary = formatContract(creatorContract); 


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    
    // --- MODIFICACIÓN (P1): Validación de mínimo si selecciona un monto ---
    if (tipAmount > 0 && tipAmount < MIN_PREMIUM_AMOUNT) {
        setErrorMsg(`El monto mínimo por respuesta premium es $${MIN_PREMIUM_AMOUNT} MXN.`);
        setStatus("error");
        return;
    }
    
    // ... (El resto del handleSubmit se mantiene) ...
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
        
        {/* --- AÑADIDO (S3): Contrato de Servicio Visible para el Anónimo --- */}
        <div className="contract-summary-box">
            <h4 style={{ fontSize: '16px', margin: '0 0 5px', color: 'var(--text-primary)' }}>
                Contrato de Servicio Premium:
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--glow-accent-crimson)', fontWeight: 'bold' }}>
                {contractSummary}
            </p>
        </div>
        {/* --- FIN AÑADIDO (S3) --- */}

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
          
          {/* --- BLOQUE TipSelector --- */}
          <TipSelector 
            selectedAmount={tipAmount}
            onSelect={setTipAmount}
          />
          {/* --- FIN DEL BLOQUE --- */}

        <button type="submit" disabled={status === "loading" || !content.trim()} className="submit-button">
          {/* --- MODIFICADO: El texto del botón cambia si hay propina --- */}
          {status === "loading" ? "Enviando..." : (tipAmount > 0 ? `Pagar y Enviar $${tipAmount}` : "Enviar Mensaje Gratis")}
        </button>
      </form>

      {status === "success" && (
        <div className="form-status-message success">
          {/* MODIFICADO: Mensaje de éxito para reflejar el Escrow (P2) */}
          <p>✅ ¡Mensaje Enviado! {tipAmount > 0 ? `Tu pago de $${tipAmount} MXN está retenido hasta que el creador te responda.` : "Se ha enviado tu mensaje."}</p>
          <p className="sub-text">Puedes ver el estado en tu <a href="/chats">bandeja de chats</a>.</p>
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