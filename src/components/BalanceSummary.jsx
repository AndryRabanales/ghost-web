// src/components/BalanceSummary.jsx
"use client";
import { useState } from "react";

export default function BalanceSummary({ creator }) {
  const [loading, setLoading] = useState(false);
  const API = (process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app").replace(/\/$/, "");

  const startOnboarding = async () => {
    // ... (Misma lógica de tu archivo anterior)
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/creators/stripe-onboarding`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({}) 
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al iniciar configuración.");
        if (data.onboarding_url) window.location.href = data.onboarding_url;
    } catch (e) { alert(e.message || "Error conectando con Stripe."); }
  };

  const handleOpenStripe = async () => {
    // ... (Misma lógica de tu archivo anterior)
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/creators/stripe-dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
             alert("⚠️ Tu conexión necesita actualizarse. Redirigiendo...");
             await startOnboarding(); return;
        }
        throw new Error(data.error || "Error al abrir panel.");
      }
      if (data.url) window.location.href = data.url;
    } catch (error) { alert(error.message); } finally { setLoading(false); }
  };

  const isReady = creator.stripeAccountId && creator.stripeAccountOnboarded;
  
  // Formateador de moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="w-full p-6 bg-[#1a1a2e] rounded-2xl border border-[#2c1a5c] mb-8 shadow-lg">
      
      {/* --- SECCIÓN SUPERIOR: ESTADO DE CONEXIÓN --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 pb-6 border-b border-[rgba(142,45,226,0.2)]">
        <div className="text-center md:text-left">
            <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
                ESTADO DE CUENTA
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-3">
                <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-[#00ff80] shadow-[0_0_10px_#00ff80]' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className={`text-xl font-black ${isReady ? 'text-white' : 'text-yellow-500'}`}>
                    {isReady ? 'Conectado a Stripe' : 'Configuración Requerida'}
                </span>
            </div>
        </div>
        <div>
            {!isReady ? (
                <button 
                    onClick={() => { setLoading(true); startOnboarding().finally(() => setLoading(false)); }}
                    disabled={loading}
                    className="bg-white text-black px-5 py-2 rounded-xl font-bold hover:scale-105 transition-transform text-sm"
                >
                    {loading ? "Cargando..." : "🏦 Conectar Banco"}
                </button>
            ) : (
                <button 
                    onClick={handleOpenStripe}
                    disabled={loading}
                    className="bg-[rgba(255,255,255,0.1)] text-white px-5 py-2 rounded-xl font-bold hover:bg-[rgba(255,255,255,0.2)] transition-all text-sm border border-[rgba(255,255,255,0.2)]"
                >
                    {loading ? "Abriendo..." : "Ver Panel Stripe ↗"}
                </button>
            )}
        </div>
      </div>

      {/* --- SECCIÓN INFERIOR: DESGLOSE DE SALDOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. DISPONIBLE (Verde) */}
          <div className="bg-[rgba(0,255,128,0.05)] border border-[rgba(0,255,128,0.2)] p-4 rounded-xl text-center">
             <div className="text-[#00ff80] text-xs font-bold uppercase mb-1">Transferido / Disponible</div>
             <div className="text-2xl font-black text-white">{formatMoney(creator.availableBalance || 0)}</div>
             <p className="text-[10px] text-gray-400 mt-1">En tu cuenta Stripe</p>
          </div>

          {/* 2. EN PROCESO (Amarillo/Naranja) - ESTA ES LA CLAVE */}
          <div className="bg-[rgba(255,193,7,0.05)] border border-[rgba(255,193,7,0.2)] p-4 rounded-xl text-center relative overflow-hidden">
             {/* Pequeña animación de carga para indicar proceso */}
             {(creator.processingBalance > 0) && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 opacity-20 animate-pulse"></div>
             )}
             <div className="text-yellow-400 text-xs font-bold uppercase mb-1">En Camino (Banco)</div>
             <div className="text-2xl font-black text-white">{formatMoney(creator.processingBalance || 0)}</div>
             <p className="text-[10px] text-gray-400 mt-1">
                 {creator.processingBalance > 0 ? "Llega en 2-4 días hábiles" : "Sin pagos en cola"}
             </p>
          </div>

          {/* 3. PENDIENTE (Gris/Morado) */}
          <div className="bg-[rgba(142,45,226,0.05)] border border-[rgba(142,45,226,0.2)] p-4 rounded-xl text-center opacity-80">
             <div className="text-[#c9a4ff] text-xs font-bold uppercase mb-1">Por Ganar</div>
             <div className="text-2xl font-black text-white">{formatMoney(creator.pendingBalance || 0)}</div>
             <p className="text-[10px] text-gray-400 mt-1">Responde para liberar</p>
          </div>

      </div>
    </div>
  );
}