// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const FALLBACK_MIN_PREMIUM_AMOUNT = 100; // Mínimo $100 (PISO FIRME)

// --- COMPONENTE DE URGENCIA MEJORADO (Muestra cupos reales) ---
const ActivityIndicator = ({ remaining }) => {
  // Si quedan pocos (ej. menos de 5), lo ponemos en amarillo/naranja para urgencia
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
  publicId, topicPreference, baseTipAmountCents, isFull, escasezData 
}) {
  const [content, setContent] = useState("");
  const [paymentInput, setPaymentInput] = useState(""); 
  const [fanEmail, setFanEmail] = useState(""); 
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0); 
  const [isMounted, setIsMounted] = useState(false);

  const basePrice = (baseTipAmountCents || (FALLBACK_MIN_PREMIUM_AMOUNT * 100)) / 100;
  const effectiveBasePrice = Math.max(basePrice, FALLBACK_MIN_PREMIUM_AMOUNT);
  const totalAmount = Number(paymentInput) || 0;

  // CALCULAMOS LOS CUPOS RESTANTES
  const limit = escasezData?.dailyMsgLimit || 30;
  const count = escasezData?.msgCountToday || 0;
  // Evitamos negativos por si acaso
  const remaining = Math.max(0, limit - count);

  useEffect(() => {
    const initialPrice = String(effectiveBasePrice);
    if (!isMounted) {
      setPaymentInput(initialPrice);
      setIsMounted(true);
    }
  }, [basePrice, isMounted, effectiveBasePrice]); 

  const handlePaymentChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPaymentInput(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (isFull) {
        setErrorMsg("Los cupos se han agotado por hoy.");
        setStatus("error");
        return;
    }

    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("Escribe un mensaje válido.");
      setStatus("error");
      return;
    }
    
    // Email es vital para el polling y la recuperación
    if (!fanEmail.includes('@')) {
      setErrorMsg("Necesitas un email para recibir tu respuesta.");
      setStatus("error");
      return;
    }

    if (totalAmount < effectiveBasePrice) {
        setErrorMsg(`Mínimo $${effectiveBasePrice} MXN para ser leído.`);
        setStatus("error");
        return;
    }
    
    setStatus("loading"); 

    try {
      const res = await fetch(`${API}/public/${publicId}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alias: "Anónimo", 
          content,
          tipAmount: totalAmount,
          fanEmail: fanEmail 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error procesando");
      if (data.url) window.location.href = data.url;

    } catch (err) {
      setErrorMsg(err.message); 
      setStatus("error");       
    }
  };
  
  // Deshabilitamos si está lleno
  const isDisabled = status === "loading" || !content.trim() || totalAmount < effectiveBasePrice || isFull;
  
  let buttonText;
  if (status === "loading") {
    buttonText = "Procesando...";
  } else if (isFull) {
    buttonText = "Agotado (Vuelve Mañana)";
  } else {
    buttonText = `Enviar Prioritario ($${(totalAmount || effectiveBasePrice).toFixed(2)})`;
  }

  const placeholderText = topicPreference ? `Tema sugerido: "${topicPreference}"...` : "Escribe tu mensaje aquí...";

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      
      {/* USAMOS EL NUEVO INDICADOR CON DATOS REALES */}
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

      <form onSubmit={handleSubmit} className="form-element-group">
        
        <textarea
            placeholder={placeholderText}
            value={content}
            onChange={(e) => { setContent(e.target.value); setCharCount(e.target.value.length); }}
            className="form-input-field"
            rows="4"
            maxLength="500"
            style={{fontSize: '16px', padding: '15px'}}
            disabled={isFull}
        ></textarea>
        <div className="char-counter">{charCount} / 500</div>
        
        {/* INPUT DE EMAIL */}
        <div style={{marginBottom: '15px'}}>
            <input
                type="email"
                placeholder="Tu email (Para avisarte cuando responda)"
                value={fanEmail}
                onChange={(e) => setFanEmail(e.target.value)}
                className="form-input-field"
                style={{fontSize: '14px'}}
                disabled={isFull}
            />
        </div>

        <div className="payment-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '15px' }}>
            <label className="payment-label">Tu Oferta (MXN)</label>
            <div className="payment-input-group">
              <span className="currency-symbol">$</span>
              <input
                  type="text"
                  inputMode="decimal" 
                  value={paymentInput}
                  onChange={handlePaymentChange}
                  placeholder={String(basePrice)}
                  className="payment-input" 
                  style={{ color: totalAmount < basePrice ? '#ff7b7b' : 'var(--text-primary)' }}
                  disabled={isFull}
              />
            </div>
            <p className="payment-priority-text">Ofertas más altas se responden primero.</p>
        </div>

        <button 
            type="submit" 
            disabled={isDisabled} 
            className="submit-button" 
            style={{
                marginTop: '15px',
                background: isFull ? '#3a3a4a' : 'linear-gradient(90deg, #8e2de2, #4a00e0)',
                cursor: isFull ? 'not-allowed' : 'pointer'
            }}
        >
          {buttonText}
        </button>
      </form>

      {status === "error" && (
        <div className="form-status-message error"><p>{errorMsg}</p></div>
      )}
    </div>
  );
}