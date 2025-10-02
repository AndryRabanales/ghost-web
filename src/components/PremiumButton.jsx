"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function PremiumButton() {
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const togglePremium = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/premium/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar premium");

      setIsPremium(data.isPremium); // 👈 toma valor del backend
    } catch (err) {
      console.error("❌ Error cambiando premium:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {isPremium ? (
        <div style={{ color: "gold", marginBottom: 8 }}>
          ⭐ Tienes Premium activo (vidas ilimitadas)
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          Actualmente tienes la versión gratuita (vidas limitadas)
        </div>
      )}

      <button
        onClick={togglePremium}
        disabled={loading}
        style={{
          padding: "8px 16px",
          borderRadius: 6,
          border: "none",
          background: isPremium ? "#c0392b" : "#27ae60",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {loading
          ? "Procesando..."
          : isPremium
          ? "Desactivar Premium"
          : "Activar Premium"}
      </button>
    </div>
  );
}
