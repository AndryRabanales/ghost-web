"use client";
import { useState, useEffect } from "react";
import { refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function PremiumButton({ onChange }) {
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const getAuthHeaders = (token) => {
    const t = token || localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // 🟢 obtener estado real del creador
  const fetchCreator = async () => {
    try {
      let res = await fetch(`${API}/creators/me`, {
        headers: getAuthHeaders(),
      });

      // renovar token si expira
      if (res.status === 401) {
        const publicId = localStorage.getItem("publicId");
        if (publicId) {
          const newToken = await refreshToken(publicId);
          if (newToken) {
            res = await fetch(`${API}/creators/me`, {
              headers: getAuthHeaders(newToken),
            });
          }
        }
      }

      if (!res.ok) {
        console.error("⚠️ Error cargando estado premium:", res.status);
        return;
      }

      const data = await res.json();
      setIsPremium(data.isPremium || false);

      // notificar al padre si existe callback (ej. DashboardPage)
      if (onChange) onChange(data);
    } catch (err) {
      console.error("❌ Error en fetchCreator:", err);
    }
  };

  const togglePremium = async () => {
    try {
      setLoading(true);

      const endpoint = isPremium
        ? `${API}/premium/deactivate`
        : `${API}/premium/activate`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar premium");

      // 🔄 mejor recargar perfil desde backend para tener vidas actualizadas
      await fetchCreator();
    } catch (err) {
      console.error(
        `❌ Error en togglePremium (${isPremium ? "deactivate" : "activate"}):`,
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // cargar el estado premium al montar
  useEffect(() => {
    fetchCreator();
  }, []);

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
