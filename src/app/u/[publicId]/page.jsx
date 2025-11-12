// src/app/u/[publicId]/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // <-- 1. Importar hooks

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const FALLBACK_MIN_PREMIUM_AMOUNT = 100; 
// --- 👇 CAMBIO 2: Límite máximo de pago ---
const MAX_PREMIUM_AMOUNT = 100000; // $100,000 MXN

// --- FUNCIÓN DE FORMATEO DE CONTRATO (S3) ---
// (Esta función se queda igual)
const formatContract = (contractData) => {
    if (typeof contractData === 'string' && contractData.trim().length > 0) {
        return contractData.trim();
    }
    return "Respuesta de alta calidad garantizada.";
}
// --- FIN: Función de Formato (S3) ---


// --- COMPONENTE EscasezCounter (S2) ---
// (Este componente se queda igual)
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


// --- 2. COMPONENTE DE FORMULARIO (YA NO ES EL DEFAULT EXPORT) ---
// Se quitó "export default" de esta función
function AnonMessageForm({ 
    publicId, 
    onChatCreated,
    escasezData, 
    isFull,
    creatorContract,
    baseTipAmountCents
}) {
  // (TODA la lógica interna de AnonMessageForm se queda exactamente igual)
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [paymentInput, setPaymentInput] = useState(""); 
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const basePrice = (baseTipAmountCents || (FALLBACK_MIN_PREMIUM_AMOUNT * 100)) / 100;
  const totalAmount = Number(paymentInput) || 0;

  useEffect(() => {
    if (basePrice > 0 && !isMounted) {
      setPaymentInput(String(basePrice));
    }
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [basePrice, isMounted]);
  
  const contractSummary = formatContract(creatorContract); 

  const handlePaymentChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');

    // --- 👇 CAMBIO 2: Aplicar validación de máximo ---
    if (value === '') {
        setPaymentInput('');
    } else if (Number(value) > MAX_PREMIUM_AMOUNT) {
        setPaymentInput(String(MAX_PREMIUM_AMOUNT));
    } else {
        setPaymentInput(value);
    }
    // --- 👆 Fin del Cambio 2 ---
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    
    if (totalAmount < basePrice) {
        setErrorMsg(`El pago mínimo para este creador es $${basePrice.toFixed(2)} MXN.`);
        setStatus("error");
        return;
    }
    
    // --- 👇 CAMBIO 2: Validación de máximo en submit ---
    if (totalAmount > MAX_PREMIUM_AMOUNT) {
        setErrorMsg(`El pago máximo es $${MAX_PREMIUM_AMOUNT.toFixed(2)} MXN.`);
        setStatus("error");
        return;
    }
    // --- 👆 Fin del Cambio 2 ---
    
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

  // --- 👇 CAMBIO 2: Actualizada la lógica de deshabilitado ---
  const isDisabled = status === "loading" || !content.trim() || isFull || totalAmount < basePrice || totalAmount > MAX_PREMIUM_AMOUNT;
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
          
          {/* --- SECCIÓN DE PAGO (MODIFICADA) --- */}
          <div className="payment-section" style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '15px', 
              marginTop: '0px'     
          }}>
              
              <label htmlFor="payment" style={{
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '8px' 
              }}>
                Monto por Respuesta Premium (Mínimo ${basePrice.toFixed(2)} MXN)
              </label>

              {/* --- 👇 CAMBIO 1: Estilo en línea para quitar el foco morado --- */}
              <div className="payment-input-group" style={{
                  marginBottom: '8px', 
                  padding: '4px 14px',
                  // Esto evita que :focus-within de globals.css ponga el borde y sombra
                  borderColor: 'rgba(255, 255, 255, 0.1)', 
                  boxShadow: 'none'
                }}>
              {/* --- 👆 Fin del Cambio 1 --- */}
                  <span className="currency-symbol" style={{
                      color: 'var(--text-primary)', 
                      fontSize: '18px', 
                      fontWeight: '700',
                      paddingLeft: '0px' 
                  }}>$</span>
                  <input
                      type="text"
                      inputMode="decimal" 
                      id="payment"
                      value={paymentInput}
                      onChange={handlePaymentChange}
                      placeholder={String(basePrice)}
                      className="payment-input" // <-- Usamos la clase correcta (sin borde)
                      style={{
                        flexGrow: 1, 
                        textAlign: 'left', 
                        fontSize: '18px',
                        fontWeight: '700',
                        padding: '6px 8px', 
                        // --- 👇 CAMBIO 1: Borde de error simple, sin morado ---
                        color: totalAmount < basePrice ? '#ff7b7b' : 'var(--text-primary)'
                      }}
                  />
                  <span className="currency-symbol" style={{paddingRight: '0px', fontSize: '16px'}}>MXN</span>
              </div>
              
              <p style={{
                  fontSize: '12px', 
                  color: 'var(--text-secondary)', 
                  textAlign: 'center', 
                  margin: '6px 0 0', 
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
// --- FIN DEL COMPONENTE DE FORMULARIO ---


// --- 3. NUEVO COMPONENTE DE PÁGINA (EL DEFAULT EXPORT) ---
export default function PublicUserPage() {
  const params = useParams();
  const router = useRouter();
  const { publicId } = params;

  const [creatorInfo, setCreatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga los datos del creador (contrato, precio, etc.) desde la API
  useEffect(() => {
    if (publicId) {
      const fetchData = async () => {
        try {
          const res = await fetch(`${API}/public/creator/${publicId}`);
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "No se pudo cargar la información del creador.");
          }
          const data = await res.json();
          setCreatorInfo(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [publicId]);

  // Define qué hacer cuando el chat se cree (redirigir)
  const handleChatCreated = (newChatEntry) => {
    if (newChatEntry.anonToken && newChatEntry.chatId) {
      router.push(`/chats/${newChatEntry.anonToken}/${newChatEntry.chatId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px', fontFamily: 'monospace' }}>
        Cargando espacio...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#ff7b7b', textAlign: 'center', paddingTop: '100px', fontFamily: 'monospace' }}>
        Error: {error}
      </div>
    );
  }

  if (!creatorInfo) {
    return (
      <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px', fontFamily: 'monospace' }}>
        Creador no encontrado.
      </div>
    );
  }

  // Renderiza el formulario, pasando los datos cargados como props
  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{
          fontSize: '34px',
          fontWeight: '800',
          letterSpacing: '-1.5px',
          background: 'linear-gradient(90deg, #8e2de2, #c9a4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 15px',
          textAlign: 'center'
        }}>
        Enviar a {creatorInfo.creatorName}
      </h1>
      <AnonMessageForm
        publicId={publicId}
        onChatCreated={handleChatCreated}
        escasezData={creatorInfo.escasezData}
        isFull={creatorInfo.isFull}
        creatorContract={creatorInfo.premiumContract}
        baseTipAmountCents={creatorInfo.baseTipAmountCents}
      />
    </div>
  );
}