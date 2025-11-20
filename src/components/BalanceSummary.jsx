// src/components/BalanceSummary.jsx
"use client";
import { useState } from "react";

export default function BalanceSummary({ creator }) {
  const [loading, setLoading] = useState(false);
  // Asegura que use la URL correcta, sin slash al final
  const API = (process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app").replace(/\/$/, "");

  // Función auxiliar para iniciar el proceso de conexión
  const startOnboarding = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/creators/stripe-onboarding`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({}) 
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al iniciar configuración.");
        
        if (data.onboarding_url) {
            window.location.href = data.onboarding_url;
        }
    } catch (e) {
        console.error(e);
        alert(e.message || "Error conectando con Stripe.");
    }
  };

  const handleOpenStripe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/creators/stripe-dashboard`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await res.json();

      if (!res.ok) {
        // 🔥 FIX: Si falla (400), no recargamos. Asumimos cuenta rota y REPARAMOS YA.
        if (res.status === 400) {
             alert("⚠️ Tu conexión necesita actualizarse. Redirigiendo...");
             await startOnboarding(); // <--- Salto directo a conectar
             return;
        }
        throw new Error(data.error || "Error al abrir panel.");
      }

      if (data.url) window.location.href = data.url;

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isReady = creator.stripeAccountId && creator.stripeAccountOnboarded;

  return (
    <div className="w-full p-6 bg-[#1a1a2e] rounded-2xl border border-[#2c1a5c] mb-8 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
            <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
                TU BILLETERA
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-3">
                <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-[#00ff80] shadow-[0_0_10px_#00ff80]' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className={`text-2xl font-black ${isReady ? 'text-white' : 'text-yellow-500'}`}>
                    {isReady ? 'Activo y Cobrando' : 'Configuración Requerida'}
                </span>
            </div>
            <p className="text-gray-500 text-xs mt-2">
                {isReady 
                    ? "Los fondos se transfieren automáticamente a tu cuenta bancaria."
                    : "Conecta tu banco para empezar a recibir pagos."}
            </p>
        </div>

        <div>
            {!isReady ? (
                <button 
                    onClick={() => { setLoading(true); startOnboarding().finally(() => setLoading(false)); }}
                    disabled={loading}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    {loading ? "Cargando..." : "🏦 Conectar Banco"}
                </button>
            ) : (
                <button 
                    onClick={handleOpenStripe}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#8e2de2] to-[#4a00e0] text-white px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_25px_rgba(142,45,226,0.4)] transition-all"
                >
                    {loading ? "Abriendo..." : "Ver Saldo en Stripe ↗"}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}