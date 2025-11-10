// src/components/BalanceSummary.jsx
"use client";
// --- MODIFICADO: Importar 'useState' y las utilidades de auth ---
import React, { useState } from "react";
import { getAuthHeaders, refreshToken } from "@/utils/auth"; // 👈 AÑADIDO

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// Icono de Dólar (sin cambios)
const MoneyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// Icono de Reloj (sin cambios)
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function BalanceSummary({ creator }) {
  // --- AÑADIDO: Estado de carga para el botón ---
  const [loading, setLoading] = useState(false);

  if (!creator) return null;

  // Formatear a moneda (sin cambios)
  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)} MXN`;
  };

  // --- INICIO DE LA MODIFICACIÓN: Lógica del botón de retiro ---
  const handleWithdraw = async () => {
    setLoading(true);

    // Si la cuenta ya está configurada, en el futuro esto iría al portal de Stripe.
    // Por ahora, nos centramos en el 'onboarding'.
    if (creator.stripeAccountOnboarded) {
      alert("Tu cuenta ya está configurada. (Lógica de 'Ver portal' pendiente)");
      setLoading(false);
      return;
    }

    // --- Lógica para crear el link de Onboarding ---
    try {
      let res = await fetch(`${API}/creators/stripe-onboarding`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      // Refrescar token si es necesario
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

      // Redirigir al usuario a la URL segura de Stripe
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      } else {
        throw new Error("No se pudo obtener la URL de configuración.");
      }

    } catch (err) {
      console.error("❌ Error al crear link de Stripe Connect:", err);
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---

  // Texto del botón y estado 'disabled'
  const isAccountReady = creator.stripeAccountOnboarded;
  const buttonText = isAccountReady ? "Retirar" : "Configurar Cuenta";
  const buttonDisabled = loading || (isAccountReady && creator.availableBalance <= 0);

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
        
        {/* --- MODIFICADO: Botón actualizado --- */}
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

      {/* Mostramos esta nota si aún no han configurado su cuenta de Stripe */}
      {!creator.stripeAccountOnboarded && (
         <p className="balance-setup-note">
           Para retirar tus fondos, necesitas configurar tu cuenta de cobro.
         </p>
      )}
    </div>
  );
}