"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
// El Mínimo ahora lo dicta el creador, pero dejamos 100 como fallback
const FALLBACK_MIN_PREMIUM_AMOUNT = 100; 

// --- FUNCIÓN DE FORMATEO DE CONTRATO (S3) ---
const formatContract = (contractData) => {
    if (typeof contractData === 'string' && contractData.trim().length > 0) {
        return contractData.trim();
    }
    return "Respuesta de alta calidad garantizada.";
}
// --- FIN: Función de Formato (S3) ---


// --- COMPONENTE EscasezCounter (S2) ---
const EscasezCounter = ({ data, isFull }) => {
  if (!data || data.dailyMsgLimit <= 0) {
    return null;
  }
  const remaining = Math.max(0, data.dailyMsgLimit - data.msgCountToday);
  const text = isFull ? "¡Límite diario alcanzado!" : `¡Solo quedan ${remaining} cupos!`;
  const subText = isFull ? "Vuelve mañana para asegurar tu lugar." : `El contador se reinicia cada 12 horas.`;
  const color = isFull ? '#ff7b7b' : 'var(--success-solid, #00ff80)'; 
  const animationStyle = {
    animation: `fadeInUp 0.5s ease forwards`,
    opacity: 0
  };

  return (
    <div style={{
      padding: '12px 15px',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '12px',
      border: `1px solid ${color}`,
      textAlign: 'center',
      marginBottom: '20px',
      ...animationStyle
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
// --- FIN EscasezCounter ---


// --- COMPONENTE PRINCIPAL ---
export default function AnonMessageForm({ 
    publicId, 
    onChatCreated,
    escasezData, 
    isFull,
    creatorContract,
    baseTipAmountCents // <-- ¡NUEVA PROP!
}) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  
  // --- CAMBIO: Un solo estado para el pago ---
  const [paymentInput, setPaymentInput] = useState(""); // El texto del input
  
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // --- El precio base (en pesos) ---
  const basePrice = (baseTipAmountCents || (FALLBACK_MIN_PREMIUM_AMOUNT * 100)) / 100;
  
  // --- CAMBIO: El monto total es lo que esté en el input ---
  const totalAmount = Number(paymentInput) || 0;

  // --- CAMBIO: Cargar el precio base en el input cuando el componente esté listo ---
  useEffect(() => {
    if (basePrice > 0 && !isMounted) {
      // Establece el precio base como valor inicial del input
      setPaymentInput(String(basePrice));
    }

    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [basePrice, isMounted]); // Se ejecuta cuando basePrice cambia
  
  const contractSummary = formatContract(creatorContract); 

  const handlePaymentChange = (e) => {
    // Permitir solo números
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPaymentInput(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    
    // --- CAMBIO: Validación de mínimo (como en tu imagen) ---
    if (totalAmount < basePrice) {
        setErrorMsg(`El pago mínimo para este creador es $${basePrice.toFixed(2)} MXN.`);
        setStatus("error");
        return;
    }
    
    if (isFull) {
        setErrorMsg("El límite diario de mensajes se ha alcanzado. Por favor, espera al reinicio.");
        setStatus("error");
        return;
    }
    
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alias, 
          content,
          // --- CAMBIO: Enviar el monto total (base + donación) ---
          tipAmount: totalAmount 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "MINIMUM_PAYMENT_REQUIRED") {
             throw new Error(data.error || `El pago mínimo es $${basePrice.toFixed(2)} MXN.`);
        }
        throw new Error(data.error || "Error enviando el mensaje");
      }

      setStatus("success");

      if (data.chatId && data.anonToken) {
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
          previewFrom: 'anon',
          creatorPremiumContract: data.creatorPremiumContract,
          baseTipAmountCents: baseTipAmountCents
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

  // El botón está deshabilitado si no hay contenido, si está cargando, o si el monto es menor al base
  const isDisabled = status === "loading" || !content.trim() || isFull || totalAmount < basePrice;

  // El texto del botón ahora siempre muestra el monto total (o el base si el input está vacío)
  const buttonText = `Pagar y Enviar $${(totalAmount || basePrice).toFixed(2)}`;

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      
      <EscasezCounter data={escasezData} isFull={isFull} />

      <form onSubmit={handleSubmit} className="form-element-group">
        
        <div className="contract-summary-box" style={{ 
            padding: '15px', 
            background: 'rgba(142, 45, 226, 0.15)', 
            borderRadius: '12px',
            border: '1px solid rgba(142, 45, 226, 0.4)',
            marginBottom: '20px'
        }}>
            <h4 style={{ fontSize: '16px', margin: '0 0 5px', color: 'var(--text-primary)' }}>
                La respuesta del creador contendrá:
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--glow-accent-crimson)', fontWeight: 'bold' }}>
                {contractSummary}
            </p>
        </div>

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
          
          {/* --- CAMBIO DRÁSTICO: SECCIÓN DE PAGO SIMPLIFICADA --- */}
          <div className="payment-section" style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '20px',
              marginTop: '5px'
          }}>
              
              <label htmlFor="payment" style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '10px'
              }}>
                Monto por Respuesta Premium (Mínimo ${basePrice.toFixed(2)} MXN)
              </label>

              <div className="payment-input-group" style={{marginBottom: '10px'}}>
                  <span className="currency-symbol" style={{
                      color: 'var(--text-primary)', 
                      fontSize: '20px', 
                      fontWeight: '700',
                      paddingLeft: '5px'
                  }}>$</span>
                  <input
                      type="number" // Input numérico
                      id="payment"
                      value={paymentInput}
                      onChange={handlePaymentChange}
                      placeholder={String(basePrice)}
                      className="form-input-field"
                      style={{
                        flexGrow: 1, 
                        textAlign: 'left', 
                        fontSize: '20px',
                        fontWeight: '700',
                        borderColor: totalAmount < basePrice ? '#ff7b7b' : 'var(--glow-accent-crimson)'
                      }}
                  />
                  <span className="currency-symbol" style={{paddingRight: '5px'}}>MXN</span>
              </div>
              
              <p style={{
                  fontSize: '13px', 
                  color: 'var(--text-secondary)', 
                  textAlign: 'center', 
                  margin: 0, 
                  opacity: 0.8
              }}>
                Puedes ofrecer más para priorizar tu mensaje.
              </p>
              
          </div>
          {/* --- FIN DEL CAMBIO --- */}

        <button type="submit" disabled={isDisabled} className="submit-button" style={{marginTop: '20px'}}>
          {status === "loading" ? "Procesando..." : buttonText}
        </button>
      </form>

      {/* --- Mensaje de éxito actualizado --- */}
      {status === "success" && (
        <div className="form-status-message success">
          <p>✅ ¡Mensaje Enviado! Tu pago de ${totalAmount.toFixed(2)} MXN está retenido hasta que el creador te responda.</p>
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