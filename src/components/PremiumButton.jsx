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
  
  if (creator?.isPremium) {
    return (
      <div style={{ color: "gold", marginBottom: 8, padding: '10px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid gold', borderRadius: '8px', textAlign: 'center' }}>
        ⭐ **¡Ya eres Premium!** Disfruta de beneficios ilimitados.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16, border: '1px solid #0070f3', padding: '20px', borderRadius: '8px', textAlign: 'center', background: '#fafafa' }}>
      <h3 style={{marginTop: 0, fontSize: '1.2em'}}>¿Quieres ser Premium?</h3>
      <p style={{color: '#666'}}>Realiza un pago único para obtener vidas ilimitadas y apoyar el proyecto.</p>
      
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          display: 'block',
          padding: "12px 24px",
          borderRadius: 8,
          border: "none",
          background: loading ? "#ccc" : "#0070f3",
          color: "#fff",
          fontWeight: 'bold',
          width: '100%',
          fontSize: '16px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background-color 0.2s ease',
        }}
      >
        {loading ? 'Redirigiendo a Mercado Pago...' : '🚀 Hacerme Premium (Pago Único)'}
      </button>
      
      {error && <p style={{ color: "red", marginTop: '10px', fontSize: '14px' }}>{error}</p>}
    </div>
  );
}