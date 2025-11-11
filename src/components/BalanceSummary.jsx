// src/components/BalanceSummary.jsx
"use client";
// --- MODIFICADO: Importar 'useState' y las utilidades de auth ---
import React, { useState } from "react";
import { getAuthHeaders, refreshToken } from "@/utils/auth"; 

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MIN_WITHDRAWAL_AMOUNT = 1000; // <-- AÑADIDO: $1000 MXN, Mínimo de retiro (P5)

// --- AÑADIDO: Definición de Iconos (MoneyIcon y ClockIcon) ---
// Icono de Dólar
const MoneyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// Icono de Reloj
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
// --- FIN AÑADIDO ---


export default function BalanceSummary({ creator }) {
  // --- AÑADIDO: Estado de carga para el botón ---
  const [loading, setLoading] = useState(false);
  // --- AÑADIDO: Estado para el mensaje de estado (retiro) ---
  const [statusMessage, setStatusMessage] = useState(null); 
  const [isError, setIsError] = useState(false);

  if (!creator) return null;

  // Formatear a moneda (sin cambios)
  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)} MXN`;
  };

  // --- INICIO DE LA MODIFICACIÓN: Lógica del botón de retiro (P5) ---
  const handleWithdraw = async () => {
    setLoading(true);
    setStatusMessage(null);
    setIsError(false);
    
    // 1. Lógica de Onboarding (Prioridad 1, se mantiene)
    if (!creator.stripeAccountOnboarded) {
        // Simulación de llamada API para configurar Stripe
        try {
          let res = await fetch(`${API}/creators/stripe-onboarding`, {
            method: 'POST',
            headers: getAuthHeaders(),
          });
    
          // Lógica de refresh si el token expiró
          if (res.status === 401) {
            const newToken = await refreshToken(localStorage.getItem("publicId"));
            if (newToken) {
              res = await fetch(`${API}/creators/stripe-onboarding`, {
                method: 'POST',
                headers: getAuthHeaders(newToken),
              });
            } else {
              throw new Error("Sesión inválida, por favor inicia sesión de nuevo.");
            }
          }
    
          const data = await res.json();
          if (!res.ok) throw new Error(data.details || "No se pudo generar el link de configuración");
    
          if (data.onboarding_url) {
            window.location.href = data.onboarding_url;
          } else {
            throw new Error("No se pudo obtener la URL de configuración.");
          }
    
        } catch (err) {
          console.error("❌ Error al crear link de Stripe Connect:", err);
          setStatusMessage(`Error: ${err.message}`);
          setIsError(true);
          setLoading(false);
        }
        return;
    }
    
    // 2. Lógica de Retiro (P5) - Solo si la cuenta está configurada
    if (creator.availableBalance < MIN_WITHDRAWAL_AMOUNT) {
        setStatusMessage(`El retiro mínimo es de ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}.`);
        setIsError(true);
        setLoading(false);
        return;
    }
    
    // 3. Simulación de Solicitud Exitosa (MVP Hack - P5)
    const withdrawalAmount = creator.availableBalance;
    
    // Mostramos el mensaje de éxito por 5 segundos
    setStatusMessage(`✅ Solicitud de retiro por ${formatCurrency(withdrawalAmount)} procesada. Recibirás el pago en 3-5 días hábiles (MVP Hack).`);
    setIsError(false);
    
    // SIMULACIÓN: En un entorno real, el backend pondría availableBalance a 0.
    // Aquí solo borramos el mensaje después de un tiempo.
    setTimeout(() => {
        setStatusMessage(null);
    }, 5000);

    setLoading(false);
  };
  // --- FIN DE LA MODIFICACIÓN (P5) ---

  // Texto del botón y estado 'disabled'
  const isAccountReady = creator.stripeAccountOnboarded;
  const isBalanceSufficient = creator.availableBalance >= MIN_WITHDRAWAL_AMOUNT;
  
  let buttonText = isAccountReady ? "Retirar" : "Configurar Cuenta";
  
  if (isAccountReady && creator.availableBalance > 0 && !isBalanceSufficient) {
      buttonText = `Retirar ($${MIN_WITHDRAWAL_AMOUNT} min)`;
  } else if (isAccountReady && creator.availableBalance > 0 && isBalanceSufficient) {
      buttonText = "Retirar";
  }
  
  const buttonDisabled = loading || (isAccountReady && !isBalanceSufficient && creator.availableBalance > 0) || (isAccountReady && creator.availableBalance === 0);

  return (
    <div className="balance-container">
      <h3 className="balance-title">Tu Balance (Simulado)</h3>
      
      {/* Balance Disponible (FULFILLED) */}
      <div className="balance-section available">
        <div className="balance-icon"><MoneyIcon /></div>
        <div className="balance-details">
          <span className="balance-label">Disponible para retirar</span>
          <span className="balance-amount">
            {formatCurrency(creator.availableBalance)}
          </span>
        </div>
        
        {/* Botón de Retiro */}
        <button 
          className="withdraw-button" 
          onClick={handleWithdraw}
          disabled={buttonDisabled}
        >
          {loading ? "Cargando..." : buttonText}
        </button>
      </div>

      {/* Balance Pendiente (PENDING) (sin cambios) */}
      <div className="balance-section pending">
        <div className="balance-icon"><ClockIcon /></div>
        <div className="balance-details">
          <span className="balance-label">Pendiente de respuesta</span>
          <span className="balance-amount">
            {formatCurrency(creator.pendingBalance)}
          </span>
        </div>
      </div>
      
      {/* Mensaje de estado/error (P5) */}
      {statusMessage && (
        <p style={{ 
            fontSize: '13px', 
            textAlign: 'center', 
            color: isError ? '#ff7b7b' : '#00ff80', 
            marginTop: '10px',
            fontWeight: '600'
        }}>
            {statusMessage}
        </p>
      )}

      {/* Mostramos esta nota si aún no han configurado su cuenta de Stripe */}
      {!creator.stripeAccountOnboarded && (
         <p className="balance-setup-note">
           Para retirar tus fondos, necesitas configurar tu cuenta de cobro.
         </p>
      )}
    </div>
  );
}