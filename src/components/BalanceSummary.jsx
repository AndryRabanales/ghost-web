// src/components/BalanceSummary.jsx
"use client";
import React, { useState } from "react";
import { getAuthHeaders, refreshToken } from "@/utils/auth"; 

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

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

export default function BalanceSummary({ creator }) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); 
  const [isError, setIsError] = useState(false);

  if (!creator) return null;

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)} MXN`;
  };

  // Manejo de Fondos (Stripe Connect Real)
  const handleManageFunds = async () => {
    setLoading(true);
    setStatusMessage(null);
    setIsError(false);
    
    const isConfigured = creator.stripeAccountOnboarded; 
    
    // Endpoint diferente según si configura o si ve ganancias
    const endpoint = isConfigured 
        ? `${API}/creators/stripe-dashboard` // Ver billetera
        : `${API}/creators/stripe-onboarding`; // Configurar primera vez

    try {
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      // Lógica de refresh de token si expiró
      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        const newToken = await refreshToken(publicId);
        if (newToken) {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: getAuthHeaders(newToken),
          });
        } else {
          throw new Error("Sesión expirada. Recarga la página.");
        }
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Error de conexión con Stripe.");

      // Redirigimos a la URL que nos dio el backend
      const redirectUrl = data.onboarding_url || data.url;
      
      if (redirectUrl) {
         window.location.href = redirectUrl;
      } else {
         throw new Error("No se recibió la URL de redirección.");
      }

    } catch (err) {
      console.error("❌ Error Stripe Connect:", err);
      setStatusMessage(err.message);
      setIsError(true);
      setLoading(false);
    }
  };
  
  const isAccountReady = creator.stripeAccountOnboarded;
  const buttonText = isAccountReady ? "Ver Billetera (Stripe)" : "Configurar Pagos";
  
  return (
    <div className="balance-container">
      <h3 className="balance-title">Tus Ganancias</h3>
      
      {/* Balance Total Generado */}
      <div className="balance-section available">
        <div className="balance-icon"><MoneyIcon /></div>
        <div className="balance-details">
          <span className="balance-label">Ingresos Totales</span>
          <span className="balance-amount">
            {formatCurrency(creator.availableBalance)}
          </span>
        </div>
        
        {/* Botón Acción (Configurar o Ver) */}
        <button 
          className="withdraw-button" 
          onClick={handleManageFunds}
          disabled={loading}
          style={{ minWidth: '130px' }}
        >
          {loading ? "Cargando..." : buttonText}
        </button>
      </div>

      {/* Balance Pendiente de Respuesta */}
      <div className="balance-section pending">
        <div className="balance-icon"><ClockIcon /></div>
        <div className="balance-details">
          <span className="balance-label">En retención (Responde para liberar)</span>
          <span className="balance-amount">
            {formatCurrency(creator.pendingBalance)}
          </span>
        </div>
      </div>
      
      {/* Mensajes de Estado */}
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

      {/* Nota Informativa */}
      {!isAccountReady ? (
         <p className="balance-setup-note">
           Configura tu cuenta para recibir depósitos automáticos en tu banco.
         </p>
      ) : (
        <p className="balance-setup-note" style={{color: 'var(--success-solid)'}}>
           ✅ Cuenta conectada. Los pagos se transfieren automáticamente
        </p>
      )}
    </div>
  );
}