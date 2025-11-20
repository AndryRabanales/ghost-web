"use client";
import { useState } from "react";

export default function BalanceSummary({ creator }) {
  const [loading, setLoading] = useState(false);
  const API = process.env.NEXT_PUBLIC_API;

  // 1. Manejar la redirección al Dashboard de Stripe (La Billetera Real)
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
      if (data.url) {
        window.location.href = data.url; // Redirigir a Stripe
      } else {
        alert("Error al abrir el panel de pagos.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejar el Onboarding (Si aún no configura pagos)
  const handleSetup = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/creators/stripe-onboarding`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.onboarding_url) window.location.href = data.onboarding_url;
    } catch (e) {
        alert("Error iniciando configuración.");
    } finally {
        setLoading(false);
    }
  };

  const isReady = creator.stripeAccountId && creator.stripeAccountOnboarded;

  return (
    <div className="w-full p-6 bg-gray-900 rounded-2xl border border-gray-800 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* IZQUIERDA: Estado de la Cuenta */}
        <div className="text-center md:text-left">
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">
                Estado Financiero
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2">
                <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className={`text-2xl font-bold ${isReady ? 'text-white' : 'text-yellow-500'}`}>
                    {isReady ? 'Activo y Cobrando' : 'Configuración Pendiente'}
                </span>
            </div>
            {isReady && (
                <p className="text-gray-500 text-xs mt-2">
                    Los depósitos y saldos se gestionan directamente en Stripe.
                </p>
            )}
        </div>

        {/* DERECHA: El Único Botón que Importa */}
        <div>
            {!isReady ? (
                <button 
                    onClick={handleSetup}
                    disabled={loading}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
                >
                    {loading ? "Cargando..." : "🏦 Conectar Cuenta Bancaria"}
                </button>
            ) : (
                <button 
                    onClick={handleOpenStripe}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#635BFF] to-[#635BFF] text-white px-8 py-3 rounded-full font-bold hover:shadow-[0_0_20px_rgba(99,91,255,0.4)] transition-all border border-[#7a73ff]"
                >
                    {loading ? "Abriendo..." : "Ver Billetera & Retirar ↗"}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}