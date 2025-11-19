// Contenido para: andryrabanales/ghost-web/ghost-web-4463a987f3e90131385d89dd5aff2cb04da1e0d4/src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const FALLBACK_MIN_PREMIUM_AMOUNT = 200; 

// --- FUNCIÓN DE FORMATEO DE CONTRATO (S3) ---
const formatContract = (contractData) => {
    if (typeof contractData === 'string' && contractData.trim().length > 0) {
        return contractData.trim();
    }
    return "Respuesta de texto garantizada (mín. 40 caracteres).";
}

// --- COMPONENTE EscasezCounter (S2) ---
const EscasezCounter = ({ data, isFull }) => {
  if (!data || data.dailyMsgLimit <= 0) return null;
  const remaining = Math.max(0, data.dailyMsgLimit - data.msgCountToday);
  const text = isFull ? "¡Límite diario alcanzado!" : `¡Solo quedan ${remaining} cupos Premium!`;
  const subText = isFull ? "Vuelve mañana." : `Se reinicia cada 12 horas.`;
  const color = isFull ? '#ff7b7b' : 'var(--success-solid, #00ff80)'; 
  const animationStyle = { animation: `fadeInUp 0.5s ease forwards`, opacity: 0 };
  return (
    <div style={{
      padding: '12px 15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px',
      border: `1px solid ${color}`, textAlign: 'center', marginBottom: '20px', ...animationStyle
    }}>
      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: color }}>
        {text}
      </h4>
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)'}}>
        {subText}
      </p>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (CORREGIDO) ---
export default function AnonMessageForm({ 
  publicId, 
  onChatCreated, 
  escasezData, 
  isFull,
  creatorContract,
  topicPreference,
  creatorName, 
  baseTipAmountCents
}) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [paymentInput, setPaymentInput] = useState(""); 
  const [fanEmail, setFanEmail] = useState(""); 
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0); 
  const [isMounted, setIsMounted] = useState(false);

  const basePrice = (baseTipAmountCents || (FALLBACK_MIN_PREMIUM_AMOUNT * 100)) / 100;
  const totalAmount = Number(paymentInput) || 0;
  
  const effectiveBasePrice = Math.max(basePrice, FALLBACK_MIN_PREMIUM_AMOUNT);

  useEffect(() => {
    const initialPrice = String(effectiveBasePrice);
    if (!isMounted) {
      setPaymentInput(initialPrice);
      setIsMounted(true);
    }
  }, [basePrice, isMounted, effectiveBasePrice]); 
  
  const contractSummary = formatContract(creatorContract); 

  const handlePaymentChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPaymentInput(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    
    if (fanEmail.trim().length > 0 && !fanEmail.includes('@')) {
      setErrorMsg("Por favor, introduce un email válido para tu recibo.");
      setStatus("error");
      return;
    }

    if (totalAmount < effectiveBasePrice) {
        setErrorMsg(`El pago mínimo es $${effectiveBasePrice.toFixed(2)} MXN.`);
        setStatus("error");
        return;
    }
    
    if (isFull) {
        setErrorMsg("El límite diario de mensajes se ha alcanzado.");
        setStatus("error");
        return;
    }
    
    setStatus("loading"); 

    try {
      const res = await fetch(`${API}/public/${publicId}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alias, 
          content,
          tipAmount: totalAmount,
          fanEmail: fanEmail 
        }),
      });

      const data = await res.json();
      
      // --- MANEJO DE ERRORES DEL BACKEND (INCLUYENDO IA) ---
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      if (data.url) { 
          window.location.href = data.url;
      } else {
          throw new Error("No se recibió el link de pago.");
      }

    } catch (err) {
      console.error("Error submit:", err);
      setErrorMsg(err.message); // Mostramos el mensaje de la IA (o cualquier otro error)
      setStatus("error");       // Mantenemos el estado en error
      // NOTA: NO hacemos setStatus("idle") aquí para que el mensaje persista
    }
  };
  
  const isDisabled = status === "loading" || !content.trim() || isFull || totalAmount < effectiveBasePrice;
  const buttonText = `Pagar y Enviar $${(totalAmount || effectiveBasePrice).toFixed(2)}`;
  const placeholderText = topicPreference 
      ? `Escribe sobre: "${topicPreference}"` 
      : "Escribe tu mensaje anónimo...";

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      
      <EscasezCounter data={escasezData} isFull={isFull} />

      <form onSubmit={handleSubmit} className="form-element-group">
        
        <input
            type="text"
            placeholder="Tu alias (opcional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="form-input-field"
          />
        
        <input
            type="email"
            placeholder="Tu email (opcional, para recibo)"
            value={fanEmail}
            onChange={(e) => setFanEmail(e.target.value)}
            className="form-input-field"
          />

        <textarea
            placeholder={placeholderText}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setCharCount(e.target.value.length);
            }}
            className="form-input-field"
            rows="4"
            maxLength="500"
        ></textarea>
          
        <div className="char-counter">{charCount} / 500</div>

        <div className="contract-summary-box" style={{ 
            padding: '15px', background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '12px', border: '1px solid var(--border-color-faint)', 
            marginBottom: '20px', textAlign: 'center'
        }}>
          <h4 style={{ 
              fontSize: '14px', margin: '0 0 8px', 
              color: 'var(--text-secondary)', fontWeight: '600'
          }}>
              Garantía del Creador (MVP):
          </h4>
          <p style={{ 
              margin: 0, fontSize: '15px', 
              color: 'var(--glow-accent-crimson)', fontWeight: 'bold' 
          }}>
              {contractSummary} 
          </p>
        </div>

        <div className="payment-section" style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '15px', marginTop: '0px'     
        }}>
            <label htmlFor="payment" className="payment-label">
              Monto por Respuesta Premium (Mínimo ${basePrice.toFixed(2)} MXN)
            </label>
            <div className="payment-input-group">
              <span className="currency-symbol">$</span>
              <input
                  type="text"
                  inputMode="decimal" 
                  id="payment"
                  value={paymentInput}
                  onChange={handlePaymentChange}
                  placeholder={String(basePrice)}
                  className="payment-input" 
                  style={{ color: totalAmount < basePrice ? '#ff7b7b' : 'var(--text-primary)' }}
              />
              <span className="currency-symbol">MXN</span>
            </div>
            <p className="payment-priority-text">
              Puedes ofrecer más para priorizar tu mensaje.
            </p>
        </div>

        <button type="submit" disabled={isDisabled} className="submit-button" style={{marginTop: '20px'}}>
          {status === "loading" ? "Redirigiendo a pago..." : buttonText}
        </button>
      </form>

      {status === "error" && (
        <div className="form-status-message error">
          <p>{errorMsg || "Hubo un error al procesar tu solicitud."}</p>
        </div>
      )}
    </div>
  );
}