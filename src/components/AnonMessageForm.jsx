// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const FALLBACK_MIN_PREMIUM_AMOUNT = 100; // Mínimo $100 (PISO FIRME)

// --- COMPONENTE DE URGENCIA (MIMÉTICO) ---
const ActivityIndicator = () => (
  <div style={{ 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    marginBottom: '20px', fontSize: '13px', color: 'var(--success-solid)', fontWeight: '600'
  }}>
    <span style={{ 
      width: '8px', height: '8px', backgroundColor: 'var(--success-solid)', 
      borderRadius: '50%', boxShadow: '0 0 8px var(--success-solid)',
      animation: 'pulse-indicator 1.5s infinite' 
    }}></span>
    El creador está aceptando mensajes ahora.
  </div>
);

export default function AnonMessageForm({ 
  publicId, topicPreference, baseTipAmountCents
}) {
  // ❌ ELIMINADO: Alias (Via Negativa - Menos es más)
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
    
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("Escribe un mensaje válido.");
      setStatus("error");
      return;
    }
    
    // Email es vital para el polling y la recuperación, lo forzamos sutilmente
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
          alias: "Anónimo", // Hardcodeado (Via Negativa)
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
  
  const isDisabled = status === "loading" || !content.trim() || totalAmount < effectiveBasePrice;
  const buttonText = status === "loading" ? "Procesando..." : `Enviar Prioritario ($${(totalAmount || effectiveBasePrice).toFixed(2)})`;
  const placeholderText = topicPreference ? `Tema sugerido: "${topicPreference}"...` : "Escribe tu mensaje aquí...";

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      
      {/* SEÑAL DE ACTIVIDAD (MIMESIS) */}
      <ActivityIndicator />

      <form onSubmit={handleSubmit} className="form-element-group">
        
        <textarea
            placeholder={placeholderText}
            value={content}
            onChange={(e) => { setContent(e.target.value); setCharCount(e.target.value.length); }}
            className="form-input-field"
            rows="4"
            maxLength="500"
            style={{fontSize: '16px', padding: '15px'}}
        ></textarea>
        <div className="char-counter">{charCount} / 500</div>
        
        {/* INPUT DE EMAIL: Re-enmarcado como BENEFICIO */}
        <div style={{marginBottom: '15px'}}>
            <input
                type="email"
                placeholder="Tu email (Para avisarte cuando responda)"
                value={fanEmail}
                onChange={(e) => setFanEmail(e.target.value)}
                className="form-input-field"
                style={{fontSize: '14px'}}
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
              />
            </div>
            <p className="payment-priority-text">Ofertas más altas se responden primero.</p>
        </div>

        <button type="submit" disabled={isDisabled} className="submit-button" style={{marginTop: '15px'}}>
          {buttonText}
        </button>
      </form>

      {status === "error" && (
        <div className="form-status-message error"><p>{errorMsg}</p></div>
      )}
    </div>
  );
}