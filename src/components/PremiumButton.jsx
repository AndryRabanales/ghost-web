// src/components/PremiumButton.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PremiumButton({ creator }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handlePayment = async () => {
    if (!creator.email) {
      alert("Para ser Premium, primero necesitas registrar una cuenta con tu email.");
      router.push('/register');
      return;
    }

    setLoading(true);
    setError(null);

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
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || "No se pudo generar el link de pago");
      
      if (data.init_point) {
        window.location.href = data.init_point;
      }

    } catch (err) {
      console.error("❌ Error al crear pago:", err);
      setError("Hubo un error al conectar con Mercado Pago. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };
  
  // Mensaje para usuarios que ya son Premium
  if (creator?.isPremium) {
    return (
      <div style={{ color: "gold", padding: '10px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid gold', borderRadius: '14px', textAlign: 'center', fontSize: '14px' }}>
        ⭐ **¡Ya eres Premium!** Disfruta de beneficios ilimitados.
      </div>
    );
  }

  // --- 👇 INICIAN LOS CAMBIOS DE ESTILO ---
  return (
    <div style={{
      padding: '20px',
      borderRadius: '16px',
      textAlign: 'center',
      background: 'linear-gradient(145deg, #2a2a2d, #212123)', // Fondo oscuro
      border: '1px solid #48484A',
      boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '8px',
        fontSize: '1.1em',
        color: '#fff',
        fontWeight: 'bold'
      }}>
        ¿Quieres ser Premium?
      </h3>
      <p style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
        margin: '0 0 16px'
      }}>
        Obtén vidas ilimitadas y apoya el proyecto con un pago único.
      </p>
      
      <button
        onClick={handlePayment}
        disabled={loading}
        className="button-shine" // Clase para efecto hover
        style={{
          display: 'block',
          padding: "12px 24px",
          borderRadius: '12px',
          border: "none",
          background: loading ? "#555" : 'linear-gradient(90deg, #FF655B, #FE3C72)', // Gradiente rojo
          color: "#fff",
          fontWeight: 'bold',
          width: '100%',
          fontSize: '16px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: loading ? 'none' : '0 6px 18px rgba(254, 60, 114, 0.3)'
        }}
      >
        {loading ? 'Redirigiendo...' : '🚀 Hacerme Premium'}
      </button>
      
      {error && <p style={{ color: "#FE3C72", marginTop: '10px', fontSize: '14px' }}>{error}</p>}
    </div>
  );
  // --- 👆 TERMINAN LOS CAMBIOS DE ESTILO ---
}