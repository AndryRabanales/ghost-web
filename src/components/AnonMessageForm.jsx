"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
// --- CAMBIO: Mínimo de fallback a 200 MXN como solicitaste ---
const FALLBACK_MIN_PREMIUM_AMOUNT = 200; 

// --- FUNCIÓN DE FORMATEO DE CONTRATO (S3) ---
const formatContract = (contractData) => {
    if (typeof contractData === 'string' && contractData.trim().length > 0) {
        return contractData.trim();
    }
    try {
        const data = typeof contractData === 'string' ? JSON.parse(contractData) : contractData;
        if (!data || Object.keys(data).length === 0) {
             return "Respuesta de alta calidad garantizada.";
        }
        let parts = [];
        if (data.include_photo) parts.push("1 Foto Exclusiva");
        if (data.text_min_chars > 0) parts.push(`Mínimo ${data.text_min_chars} caracteres de texto`);
        if (data.include_pdf) parts.push("1 Archivo PDF");
        return parts.length > 0 ? parts.join(', ') : "Respuesta de alta calidad garantizada.";
    } catch (e) {
        return "Respuesta de alta calidad garantizada.";
    }
}
// --- FIN: Función de Formato (S3) ---


// --- COMPONENTE EscasezCounter (S2) ---
const EscasezCounter = ({ data, isFull }) => {
  if (!data || data.dailyMsgLimit <= 0) {
    return null;
  }
  const remaining = Math.max(0, data.dailyMsgLimit - data.msgCountToday);
  const text = isFull ? "¡Límite diario alcanzado!" : `¡Solo quedan ${remaining} cupos Premium!`;
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
    baseTipAmountCents // Esta prop viene de page.jsx
}) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [paymentInput, setPaymentInput] = useState(""); // Estado para el input de pago
  
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Calcula el precio base. Usa el del creador, o el fallback de 200.
  const basePrice = (baseTipAmountCents || (FALLBACK_MIN_PREMIUM_AMOUNT * 100)) / 100;
  
  // El monto total es lo que esté en el input
  const totalAmount = Number(paymentInput) || 0;

  // Carga el precio base en el input cuando el componente esté listo
  useEffect(() => {
    // Asegura que el valor inicial sea al menos el mínimo de 200
    const initialPrice = String(Math.max(basePrice, FALLBACK_MIN_PREMIUM_AMOUNT));
    if (!isMounted) {
      setPaymentInput(initialPrice);
    }
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [basePrice, isMounted]); // Se ejecuta si basePrice cambia
  
  const contractSummary = formatContract(creatorContract); 

  const handlePaymentChange = (e) => {
    // Permitir solo números y un punto decimal
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPaymentInput(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    
    // Validación de mínimo (usa el valor más alto entre el del creador y 200)
    const effectiveBasePrice = Math.max(basePrice, FALLBACK_MIN_PREMIUM_AMOUNT);
    if (totalAmount < effectiveBasePrice) {
        setErrorMsg(`El pago mínimo es $${effectiveBasePrice.toFixed(2)} MXN.`);
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
          tipAmount: totalAmount // Enviar el monto total
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "MINIMUM_PAYMENT_REQUIRED") {
             throw new Error(data.error || `El pago mínimo es $${effectiveBasePrice.toFixed(2)} MXN.`);
        }
        throw new Error(data.error || "Error enviando el mensaje");
      }

      setStatus("success");

      // Guardar en localStorage y notificar al padre (page.jsx)
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
          baseTipAmountCents: baseTipAmountCents // Guardar el precio base real
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

  // Define el precio base efectivo (el mayor entre el del creador y 200)
  const effectiveBasePrice = Math.max(basePrice, FALLBACK_MIN_PREMIUM_AMOUNT);
  
  // El botón está deshabilitado si no hay contenido, si está cargando, o si el monto es menor al base
  const isDisabled = status === "loading" || !content.trim() || isFull || totalAmount < effectiveBasePrice;

  // El texto del botón se actualiza dinámicamente
  const buttonText = `Pagar y Enviar $${(totalAmount || effectiveBasePrice).toFixed(2)}`;

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

        {/* Input para Alias */}
        <input
            type="text"
            placeholder="Tu alias (opcional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="form-input-field"
          />
          
        {/* --- CAMBIO: de <textarea> a <input> --- */}
        <input
            type="text"
            placeholder="Escribe tu mensaje anónimo..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input-field"
            maxLength="280"
          />
        {/* --- FIN DEL CAMBIO --- */}
          
        {/* --- CAMBIO: Contador de caracteres eliminado --- */}
          
        {/* --- SECCIÓN DE PAGO (Como en la imagen) --- */}
        <div className="payment-section">
            <label htmlFor="payment" className="payment-label">
              Monto por Respuesta Premium (Mínimo ${effectiveBasePrice.toFixed(2)} MXN)
            </label>

            <div className="payment-input-group">
                <span className="currency-symbol">$</span>
                <input
                    type="number" // Input numérico
                    id="payment"
                    value={paymentInput}
                    onChange={handlePaymentChange}
                    placeholder={String(effectiveBasePrice)}
                    className="payment-input" // Clase de globals.css
                    min={effectiveBasePrice}
                />
                <span className="currency-symbol">MXN</span>
            </div>
            
            <p className="payment-priority-text">
              Puedes ofrecer más para priorizar tu mensaje.
            </p>
        </div>
        {/* --- FIN DE SECCIÓN DE PAGO --- */}

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