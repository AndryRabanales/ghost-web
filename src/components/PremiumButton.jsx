// src/components/PremiumButton.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // 👈 Importar useRouter
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PremiumButton({ creator }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // 👈 Inicializar router

  const handleSubscribe = async () => {
    // 👇 ¡LA LÓGICA CLAVE! 👇
    // Si el usuario no tiene email, es un invitado.
    if (!creator.email) {
      alert("Para suscribirte a Premium, primero necesitas crear una cuenta para guardar tu compra.");
      router.push('/register'); // Lo mandamos a registrarse
      return;
    }

    // Si tiene email, es un usuario registrado. Procedemos con el pago.
    setLoading(true);
    try {
      let res = await fetch(`${API}/premium/create-subscription`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        const newToken = await refreshToken(localStorage.getItem("publicId"));
        if (newToken) {
          res = await fetch(`${API}/premium/create-subscription`, {
            method: 'POST',
            headers: getAuthHeaders(newToken),
          });
        }
      }
      
      if (!res.ok) throw new Error("No se pudo generar el link de pago");
      
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }

    } catch (err) {
      console.error("❌ Error al suscribirse:", err);
      alert("Hubo un error al intentar suscribirte. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };
  
  if (creator?.isPremium) {
    return (
      <div style={{ color: "gold", marginBottom: 8, padding: '10px', background: '#333', borderRadius: '8px', textAlign: 'center' }}>
        ⭐ ¡Ya eres Premium! Disfruta de vidas ilimitadas.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16, border: '1px solid #0070f3', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
      <h3 style={{marginTop: 0}}>¿Te quedas sin vidas?</h3>
      <p>¡Conviértete en Premium para tener respuestas ilimitadas!</p>
      <button
        onClick={handleSubscribe}
        disabled={loading}
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
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Generando link...' : '🚀 Hacerme Premium'}
      </button>
    </div>
  );
}