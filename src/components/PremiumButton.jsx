"use client";
import { useState, useEffect } from "react";
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
// ¡Aquí ponemos tu nuevo link de suscripción!
const SUBSCRIPTION_LINK = "https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=094c9c062ad54eecb0f4d0feb72bbd85";

export default function PremiumButton({ onChange }) {
  const [isPremium, setIsPremium] = useState(false);

  // Esta función sigue siendo importante para saber si el usuario YA es premium.
  const fetchCreatorStatus = async () => {
    try {
      let res = await fetch(`${API}/creators/me`, { headers: getAuthHeaders() });
      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(`${API}/creators/me`, { headers: getAuthHeaders(newToken) });
          }
        }
      }
      if (!res.ok) return;
      const data = await res.json();
      setIsPremium(data.isPremium || false);
      if (onChange) onChange(data);
    } catch (err) {
      console.error("❌ Error en fetchCreatorStatus:", err);
    }
  };

  useEffect(() => {
    fetchCreatorStatus();
  }, []);

  // Si el usuario ya es premium, le mostramos un mensaje de agradecimiento.
  if (isPremium) {
    return (
      <div style={{ color: "gold", marginBottom: 8, padding: '10px', background: '#333', borderRadius: '8px', textAlign: 'center' }}>
        ⭐ ¡Eres Premium! Disfruta de vidas ilimitadas.
      </div>
    );
  }

  // Si no es premium, mostramos un link (con estilo de botón) que lleva directo a la suscripción.
  return (
    <div style={{ marginBottom: 16, border: '1px solid #0070f3', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{marginTop: 0}}>¿Te quedas sin vidas?</h3>
      <p>¡Suscríbete a Premium para tener respuestas ilimitadas!</p>
      <a
        href={SUBSCRIPTION_LINK}
        target="_blank" // Abre en una nueva pestaña para no perder tu página
        rel="noopener noreferrer"
        style={{
          display: 'block',
          padding: "10px 20px",
          borderRadius: 6,
          border: "none",
          background: "#0070f3",
          color: "#fff",
          textDecoration: 'none',
          fontWeight: 'bold',
          width: '100%',
          fontSize: '16px',
          boxSizing: 'border-box'
        }}
      >
        🚀 Suscribirme a Premium
      </a>
    </div>
  );
}