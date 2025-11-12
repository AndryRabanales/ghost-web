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
  
  // --- CAMBIO: Nuevo estado para la donación (prioridad) ---
  const [donationInput, setDonationInput] = useState(""); // El texto del input
  
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- CAMBIO: El precio base y el total ahora se calculan ---
  const basePrice = (baseTipAmountCents || (FALLBACK_MIN_PREMIUM_AMOUNT * 100)) / 100;
  const donationAmount = Number(donationInput) || 0;
  const totalAmount = basePrice + donationAmount;
  // --- FIN DEL CAMBIO ---

  const contractSummary = formatContract(creatorContract); 

  const handleDonationChange = (e) => {
    // Permitir solo números
    const value = e.target.value.replace(/[^0-9]/g, '');
    setDonationInput(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    
    // --- CAMBIO: Validación de mínimo ---
    // (La API también valida esto, pero es bueno tenerlo en el front)
    if (totalAmount < basePrice) {
        setErrorMsg(`El pago mínimo es $${basePrice} MXN.`);
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
             throw new Error(data.error || `El pago mínimo es $${basePrice} MXN.`);
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

  // El botón está deshabilitado si no hay contenido O si el servidor está ocupado O si está lleno
  const isDisabled = status === "loading" || !content.trim() || isFull;

  return (
    <div className={`anon-form-container ${isMounted ? 'mounted' : ''}`}>
      
      {/* --- Contador de Escasez (ya existe) --- */}
      <EscasezCounter data={escasezData} isFull={isFull} />

      <form onSubmit={handleSubmit} className="form-element-group">
        
        {/* --- Contrato de Servicio (ya existe) --- */}
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
          
          {/* --- CAMBIO: SECCIÓN DE PAGO (REEMPLAZA A TipSelector) --- */}
          <div className="payment-section" style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px 0'
          }}>
              
              {/* 1. Precio Base (Texto fijo) */}
              <div className="payment-input-group" style={{marginBottom: '15px'}}>
                  <label htmlFor="base-price" style={{flexBasis: 'auto', textAlign: 'left'}}>Precio Base:</label>
                  <span style={{
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)', 
                      flexGrow: 1, 
                      textAlign: 'right'
                  }}>
                      ${basePrice.toFixed(2)} MXN
                  </span>
              </div>
              
              {/* 2. Donación (Prioridad) (Input opcional) */}
              <div className="payment-input-group">
                  <label htmlFor="donation" style={{flexBasis: 'auto', textAlign: 'left', color: 'var(--glow-accent-crimson)'}}>
                    Prioriza tu mensaje (Opcional):
                  </label>
                  <span className="currency-symbol" style={{color: 'var(--glow-accent-crimson)'}}>$</span>
                  <input
                      type="number"
                      id="donation"
                      value={donationInput}
                      onChange={handleDonationChange}
                      placeholder="0"
                      className="form-input-field"
                      style={{
                        flexGrow: 1, 
                        maxWidth: '120px', 
                        textAlign: 'right', 
                        borderColor: donationAmount > 0 ? 'var(--glow-accent-crimson)' : 'rgba(255, 255, 255, 0.1)'
                      }}
                  />
                  <span className="currency-symbol" style={{color: 'var(--glow-accent-crimson)'}}>MXN</span>
              </div>
              
              {/* 3. Total (Texto dinámico) */}
              <div style={{textAlign: 'right', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
                  <span style={{fontSize: '16px', color: 'var(--text-secondary)'}}>Total a Pagar: </span>
                  <span style={{fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)'}}>
                      ${totalAmount.toFixed(2)} MXN
                  </span>
              </div>
          </div>
          {/* --- FIN DEL CAMBIO --- */}

        {/* --- CAMBIO: Texto del botón --- */}
        <button type="submit" disabled={isDisabled} className="submit-button">
          {status === "loading" ? "Procesando..." : `Pagar y Enviar $${totalAmount.toFixed(2)}`}
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