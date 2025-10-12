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

  // --- ✨ ESTILOS JSX Y KEYFRAMES MEJORADOS ---
  const styles = `
    @keyframes premium-pulse-glow {
      0% {
        box-shadow: 0 0 15px rgba(254, 60, 114, 0.4), 0 0 5px rgba(255, 101, 91, 0.3);
      }
      50% {
        box-shadow: 0 0 30px rgba(254, 60, 114, 0.8), 0 0 10px rgba(255, 101, 91, 0.6);
      }
      100% {
        box-shadow: 0 0 15px rgba(254, 60, 114, 0.4), 0 0 5px rgba(255, 101, 91, 0.3);
      }
    }

    @keyframes background-pan {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .premium-upgrade-button {
      position: relative;
      overflow: hidden;
      display: block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(90deg, #FF655B, #FE3C72, #ff9691, #FE3C72, #FF655B);
      background-size: 300% auto;
      color: #fff;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
      animation: premium-pulse-glow 4s infinite ease-in-out, background-pan 5s linear infinite;
    }

    .premium-upgrade-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 75%;
      height: 100%;
      background: linear-gradient(110deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0) 60%);
      transform: skewX(-25deg);
      transition: left 1s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .premium-upgrade-button:hover::before {
      left: 150%;
    }

    .premium-upgrade-button:hover:not(:disabled) {
      transform: translateY(-3px) scale(1.02);
    }

    .premium-upgrade-button:active:not(:disabled) {
      transform: translateY(-1px) scale(1);
    }

    .premium-upgrade-button:disabled {
      background: #555;
      cursor: wait;
      animation: none;
      box-shadow: none;
    }
  `;

  if (creator?.isPremium) {
    return (
      <div style={{ color: "gold", padding: '10px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid gold', borderRadius: '14px', textAlign: 'center', fontSize: '14px' }}>
        ⭐ **¡Ya eres Premium!** Disfruta de beneficios ilimitados.
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{
        padding: '15px',
        borderRadius: '16px',
        textAlign: 'center',
        background: 'linear-gradient(145deg, #2a2a2d, #212123)',
        border: '1px solid #48484A',
        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        marginTop: '10px'
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
          className="premium-upgrade-button"
        >
          {loading ? 'Redirigiendo...' : '🚀 Hacerme Premium'}
        </button>
        
        {error && <p style={{ color: "#FE3C72", marginTop: '10px', fontSize: '14px' }}>{error}</p>}
      </div>
    </>
  );
}